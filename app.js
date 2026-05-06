const scriptInput = document.getElementById("scriptInput");
const prompterViewport = document.getElementById("prompterViewport");
const prompterText = document.getElementById("prompterText");
const modeSelect = document.getElementById("modeSelect");
const micStatus = document.getElementById("micStatus");
const startPauseBtn = document.getElementById("startPauseBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const leftMarginSlider = document.getElementById("leftMarginSlider");
const leftMarginValue = document.getElementById("leftMarginValue");
const rightMarginSlider = document.getElementById("rightMarginSlider");
const rightMarginValue = document.getElementById("rightMarginValue");
const fontDownBtn = document.getElementById("fontDownBtn");
const fontUpBtn = document.getElementById("fontUpBtn");
const fontSizeValue = document.getElementById("fontSizeValue");
const darkModeToggle = document.getElementById("darkModeToggle");
const mirrorModeToggle = document.getElementById("mirrorModeToggle");
const mirrorVerticalToggle = document.getElementById("mirrorVerticalToggle");

let scrollSpeed = Number(speedSlider.value);
let isScrolling = false;
let animationFrameId = null;
let lastTimestamp = null;
let preciseScrollTop = 0;
let fontSize = 42;
let leftMargin = Number(leftMarginSlider.value);
let rightMargin = Number(rightMarginSlider.value);

/** @type {'fixed' | 'auto'} */
let mode = "fixed";

/** @type {{ text: string, normalized: string, el: HTMLElement }[]} */
let words = [];
let currentWordIndex = 0;

/** @type {SpeechRecognition | null} */
let recognition = null;

/** Tokens consumed from the cumulative transcript string (avoids replay on interim updates). */
let processedTokenCount = 0;

const MIN_FONT_SIZE = 24;
const MAX_FONT_SIZE = 110;
const SCROLL_JUMP_LINES = 3;
const SPEECH_MATCH_WINDOW = 8;
const WORD_FLASH_MS = 600;
const READ_POSITION_RATIO = 0.2;

const TOKEN_REGEX = /(\S+|\s+)/g;

function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isSpeechRecognitionSupported() {
  return typeof getSpeechRecognitionConstructor() === "function";
}

function normalizeWord(text) {
  return text.toLowerCase().replace(/[^a-z0-9']/g, "");
}

function transcriptToNormalizedTokens(transcript) {
  return transcript
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeWord)
    .filter((t) => t.length > 0);
}

function getCombinedTranscript(results) {
  let full = "";
  for (let i = 0; i < results.length; i += 1) {
    full += results[i][0].transcript;
  }
  return full;
}

function renderWords(rawText) {
  words = [];
  prompterText.replaceChildren();

  const matches = rawText.match(TOKEN_REGEX);
  if (!matches) {
    return;
  }

  let wordIndex = 0;
  for (const token of matches) {
    if (/^\s+$/.test(token)) {
      prompterText.appendChild(document.createTextNode(token));
    } else {
      const span = document.createElement("span");
      span.className = "word";
      span.dataset.i = String(wordIndex);
      span.textContent = token;
      const normalized = normalizeWord(token);
      words.push({ text: token, normalized, el: span });
      prompterText.appendChild(span);
      wordIndex += 1;
    }
  }
}

function updateModeBodyClass() {
  document.body.classList.toggle("mode-auto", mode === "auto");
}

function hasScript() {
  return scriptInput.value.trim().length > 0;
}

function updateStartButtonState() {
  startPauseBtn.disabled = !hasScript();
}

function updatePromptText() {
  if (!hasScript()) {
    prompterText.textContent = "Paste text into the input box to begin.";
    words = [];
    currentWordIndex = 0;
    stopScrolling();
    setViewportScrollTop(0);
  } else if (mode === "auto") {
    renderWords(scriptInput.value);
    currentWordIndex = 0;
  } else {
    prompterText.textContent = scriptInput.value;
    words = [];
    currentWordIndex = 0;
  }
  updateStartButtonState();
}

function updateSpeedLabel() {
  speedValue.textContent = `${scrollSpeed} px/s`;
}

function adjustScrollSpeed(delta) {
  if (mode === "auto") {
    return;
  }
  const minSpeed = Number(speedSlider.min);
  const maxSpeed = Number(speedSlider.max);
  scrollSpeed = Math.max(minSpeed, Math.min(maxSpeed, scrollSpeed + delta));
  speedSlider.value = String(scrollSpeed);
  updateSpeedLabel();
}

function updateFontSize() {
  prompterText.style.fontSize = `${fontSize}px`;
  fontSizeValue.textContent = `${fontSize}px`;
}

function adjustFontSize(delta) {
  fontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fontSize + delta));
  updateFontSize();
}

function updateMargins() {
  prompterText.style.marginLeft = `${leftMargin}px`;
  prompterText.style.marginRight = `${rightMargin}px`;
  leftMarginValue.textContent = `${leftMargin} px`;
  rightMarginValue.textContent = `${rightMargin} px`;
}

function adjustMargins(delta) {
  const leftMin = Number(leftMarginSlider.min);
  const leftMax = Number(leftMarginSlider.max);
  const rightMin = Number(rightMarginSlider.min);
  const rightMax = Number(rightMarginSlider.max);

  leftMargin = Math.max(leftMin, Math.min(leftMax, leftMargin + delta));
  rightMargin = Math.max(rightMin, Math.min(rightMax, rightMargin + delta));
  leftMarginSlider.value = String(leftMargin);
  rightMarginSlider.value = String(rightMargin);
  updateMargins();
}

function updateMirrorTransform() {
  const scaleX = mirrorModeToggle.checked ? -1 : 1;
  const scaleY = mirrorVerticalToggle.checked ? -1 : 1;
  prompterText.style.transform = `scale(${scaleX}, ${scaleY})`;
}

function isVerticalMirrorEnabled() {
  return mirrorVerticalToggle.checked;
}

function setRunningState(nextValue) {
  isScrolling = nextValue;
  startPauseBtn.textContent = isScrolling ? "Pause" : "Start";
}

function getMaxScrollTop() {
  return Math.max(0, prompterViewport.scrollHeight - prompterViewport.clientHeight);
}

function setViewportScrollTop(nextScrollTop) {
  const clampedScrollTop = Math.max(0, Math.min(getMaxScrollTop(), nextScrollTop));
  preciseScrollTop = clampedScrollTop;
  prompterViewport.scrollTop = clampedScrollTop;
}

function getScrollJumpAmount() {
  const computedLineHeight = Number.parseFloat(getComputedStyle(prompterText).lineHeight);
  const safeLineHeight = Number.isFinite(computedLineHeight)
    ? computedLineHeight
    : fontSize * 1.5;
  return safeLineHeight * SCROLL_JUMP_LINES;
}

function jumpScroll(direction) {
  const nextScrollTop = prompterViewport.scrollTop + direction * getScrollJumpAmount();
  setViewportScrollTop(nextScrollTop);
}

function tryAdvance(spokenTokens) {
  for (const token of spokenTokens) {
    const sliceEnd = Math.min(words.length, currentWordIndex + SPEECH_MATCH_WINDOW);
    const windowWords = words.slice(currentWordIndex, sliceEnd);
    const offset = windowWords.findIndex((w) => w.normalized === token);
    if (offset >= 0) {
      currentWordIndex += offset + 1;
      flashAndScrollTo(currentWordIndex - 1);
    }
  }
}

function flashAndScrollTo(wordIndex) {
  const entry = words[wordIndex];
  if (!entry?.el) {
    return;
  }

  const { el } = entry;
  el.classList.add("flash");
  window.setTimeout(() => {
    el.classList.remove("flash");
  }, WORD_FLASH_MS);

  const targetTop = el.offsetTop - prompterViewport.clientHeight * READ_POSITION_RATIO;
  prompterViewport.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "smooth",
  });
}

function handleSpeechResult(event) {
  if (!isScrolling || mode !== "auto") {
    return;
  }

  const full = getCombinedTranscript(event.results);
  let allTokens = transcriptToNormalizedTokens(full);

  if (allTokens.length < processedTokenCount) {
    processedTokenCount = 0;
  }

  const newTokens = allTokens.slice(processedTokenCount);
  processedTokenCount = allTokens.length;

  if (newTokens.length > 0) {
    tryAdvance(newTokens);
  }
}

function handleSpeechError(event) {
  if (event.error === "no-speech" || event.error === "aborted") {
    return;
  }
  if (event.error === "not-allowed") {
    window.alert("Microphone permission is required for Automatic Scrolling.");
    stopScrolling();
    return;
  }
  console.error("Speech recognition error:", event.error);
}

function stopRecognition() {
  if (recognition !== null) {
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      // Ignore if already stopped.
    }
    recognition = null;
  }
  micStatus.hidden = true;
}

function ensureRecognition() {
  const Ctor = getSpeechRecognitionConstructor();
  if (!Ctor) {
    return null;
  }

  const r = new Ctor();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-US";
  r.onresult = handleSpeechResult;
  r.onerror = handleSpeechError;
  r.onend = () => {
    if (isScrolling && mode === "auto" && recognition === r) {
      try {
        r.start();
      } catch {
        // Already running or invalid state; ignore.
      }
    }
  };

  return r;
}

function scrollLoop(timestamp) {
  if (!isScrolling || mode !== "fixed") {
    return;
  }

  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  const elapsedSeconds = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  const maxScrollTop = getMaxScrollTop();
  const direction = isVerticalMirrorEnabled() ? -1 : 1;
  const nextScrollTop = preciseScrollTop + direction * scrollSpeed * elapsedSeconds;
  setViewportScrollTop(nextScrollTop);

  if (!isVerticalMirrorEnabled() && prompterViewport.scrollTop >= maxScrollTop) {
    stopScrolling();
    return;
  }

  if (isVerticalMirrorEnabled() && prompterViewport.scrollTop <= 0) {
    stopScrolling();
    return;
  }

  animationFrameId = window.requestAnimationFrame(scrollLoop);
}

function startScrolling() {
  if (!hasScript()) {
    return;
  }

  if (mode === "auto") {
    if (!isSpeechRecognitionSupported()) {
      window.alert(
        "Automatic Scrolling requires a browser that supports the Web Speech API (e.g. Chrome, Edge, or Safari)."
      );
      return;
    }

    if (words.length === 0) {
      renderWords(scriptInput.value);
      currentWordIndex = 0;
    }

    if (words.length === 0) {
      return;
    }

    stopRecognition();
    processedTokenCount = 0;
    recognition = ensureRecognition();
    if (!recognition) {
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      console.error("Speech recognition start failed:", error);
      recognition = null;
      return;
    }

    micStatus.hidden = false;
    setRunningState(true);
    lastTimestamp = null;
    return;
  }

  if (isVerticalMirrorEnabled() && prompterViewport.scrollTop === 0) {
    setViewportScrollTop(getMaxScrollTop());
  }

  preciseScrollTop = prompterViewport.scrollTop;
  setRunningState(true);
  lastTimestamp = null;
  animationFrameId = window.requestAnimationFrame(scrollLoop);
}

function stopScrolling() {
  setRunningState(false);
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  lastTimestamp = null;
  stopRecognition();
}

scriptInput.addEventListener("input", updatePromptText);

modeSelect.addEventListener("change", () => {
  stopScrolling();
  mode = modeSelect.value;

  if (mode === "auto" && !isSpeechRecognitionSupported()) {
    window.alert(
      "Automatic Scrolling requires a browser that supports the Web Speech API (e.g. Chrome, Edge, or Safari)."
    );
    modeSelect.value = "fixed";
    mode = "fixed";
  }

  currentWordIndex = 0;
  processedTokenCount = 0;
  updateModeBodyClass();
  updatePromptText();
  setViewportScrollTop(0);
});

startPauseBtn.addEventListener("click", () => {
  if (!isScrolling) {
    startScrolling();
  } else {
    stopScrolling();
  }
});

speedSlider.addEventListener("input", (event) => {
  scrollSpeed = Number(event.target.value);
  updateSpeedLabel();
});

leftMarginSlider.addEventListener("input", (event) => {
  leftMargin = Number(event.target.value);
  updateMargins();
});

rightMarginSlider.addEventListener("input", (event) => {
  rightMargin = Number(event.target.value);
  updateMargins();
});

fontDownBtn.addEventListener("click", () => {
  adjustFontSize(-2);
});

fontUpBtn.addEventListener("click", () => {
  adjustFontSize(2);
});

darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("light", !darkModeToggle.checked);
});

mirrorModeToggle.addEventListener("change", () => {
  updateMirrorTransform();
});

mirrorVerticalToggle.addEventListener("change", () => {
  updateMirrorTransform();
  if (!hasScript()) {
    return;
  }

  stopScrolling();
  currentWordIndex = 0;
  if (isVerticalMirrorEnabled()) {
    setViewportScrollTop(getMaxScrollTop());
  } else {
    setViewportScrollTop(0);
  }
});

async function toggleFullscreen() {
  const isFullscreen = document.fullscreenElement === prompterViewport;
  try {
    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await prompterViewport.requestFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen toggle failed:", error);
  }
}

fullscreenBtn.addEventListener("click", toggleFullscreen);

document.addEventListener("keydown", (event) => {
  if (document.activeElement === scriptInput) {
    return;
  }

  switch (event.key) {
    case " ":
      event.preventDefault();
      if (isScrolling) {
        stopScrolling();
      } else {
        startScrolling();
      }
      break;
    case "ArrowUp":
      event.preventDefault();
      jumpScroll(-1);
      break;
    case "ArrowDown":
      event.preventDefault();
      jumpScroll(1);
      break;
    case "ArrowLeft":
      event.preventDefault();
      adjustScrollSpeed(-10);
      break;
    case "ArrowRight":
      event.preventDefault();
      adjustScrollSpeed(10);
      break;
    case "<":
      event.preventDefault();
      adjustMargins(-10);
      break;
    case ">":
      event.preventDefault();
      adjustMargins(10);
      break;
    case "_":
      event.preventDefault();
      adjustFontSize(-2);
      break;
    case "+":
      event.preventDefault();
      adjustFontSize(2);
      break;
    case "f":
      event.preventDefault();
      toggleFullscreen();
      break;
    case "F":
      event.preventDefault();
      toggleFullscreen();
      break;
    case "v":
      event.preventDefault();
      mirrorVerticalToggle.checked = !mirrorVerticalToggle.checked;
      mirrorVerticalToggle.dispatchEvent(new Event("change"));
      break;
    case "V":
      event.preventDefault();
      mirrorVerticalToggle.checked = !mirrorVerticalToggle.checked;
      mirrorVerticalToggle.dispatchEvent(new Event("change"));
      break;
    default:
      break;
  }
});

function updateFullscreenButtonLabel() {
  const isFullscreen = document.fullscreenElement === prompterViewport;
  fullscreenBtn.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
}

document.addEventListener("fullscreenchange", updateFullscreenButtonLabel);

updateSpeedLabel();
updateFontSize();
updateMargins();
updateMirrorTransform();
mode = modeSelect.value;
updateModeBodyClass();
updatePromptText();
updateFullscreenButtonLabel();
