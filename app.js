const scriptInput = document.getElementById("scriptInput");
const prompterViewport = document.getElementById("prompterViewport");
const prompterText = document.getElementById("prompterText");
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
let fontSize = 42;
let leftMargin = Number(leftMarginSlider.value);
let rightMargin = Number(rightMarginSlider.value);

const MIN_FONT_SIZE = 24;
const MAX_FONT_SIZE = 90;
const SCROLL_JUMP_LINES = 3;

function updateFullscreenButtonLabel() {
  const isFullscreen = document.fullscreenElement === prompterViewport;
  fullscreenBtn.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
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
    stopScrolling();
    prompterViewport.scrollTop = 0;
  } else {
    prompterText.textContent = scriptInput.value;
  }
  updateStartButtonState();
}

function updateSpeedLabel() {
  speedValue.textContent = `${scrollSpeed} px/s`;
}

function adjustScrollSpeed(delta) {
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

function updateMargins() {
  prompterText.style.marginLeft = `${leftMargin}px`;
  prompterText.style.marginRight = `${rightMargin}px`;
  leftMarginValue.textContent = `${leftMargin} px`;
  rightMarginValue.textContent = `${rightMargin} px`;
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

function getScrollJumpAmount() {
  const computedLineHeight = Number.parseFloat(getComputedStyle(prompterText).lineHeight);
  const safeLineHeight = Number.isFinite(computedLineHeight)
    ? computedLineHeight
    : fontSize * 1.5;
  return safeLineHeight * SCROLL_JUMP_LINES;
}

function jumpScroll(direction) {
  const maxScrollTop = prompterViewport.scrollHeight - prompterViewport.clientHeight;
  const nextScrollTop = prompterViewport.scrollTop + direction * getScrollJumpAmount();
  prompterViewport.scrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
}

function scrollLoop(timestamp) {
  if (!isScrolling) {
    return;
  }

  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  const elapsedSeconds = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  const maxScrollTop = prompterViewport.scrollHeight - prompterViewport.clientHeight;
  const direction = isVerticalMirrorEnabled() ? -1 : 1;
  const nextScrollTop = prompterViewport.scrollTop + direction * scrollSpeed * elapsedSeconds;
  prompterViewport.scrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));

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

  if (isVerticalMirrorEnabled() && prompterViewport.scrollTop === 0) {
    prompterViewport.scrollTop = prompterViewport.scrollHeight - prompterViewport.clientHeight;
  }

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
}

scriptInput.addEventListener("input", updatePromptText);

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
  fontSize = Math.max(MIN_FONT_SIZE, fontSize - 2);
  updateFontSize();
});

fontUpBtn.addEventListener("click", () => {
  fontSize = Math.min(MAX_FONT_SIZE, fontSize + 2);
  updateFontSize();
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
  if (isVerticalMirrorEnabled()) {
    prompterViewport.scrollTop = prompterViewport.scrollHeight - prompterViewport.clientHeight;
  } else {
    prompterViewport.scrollTop = 0;
  }
});

fullscreenBtn.addEventListener("click", async () => {
  const isFullscreen = document.fullscreenElement === prompterViewport;
  try {
    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await prompterViewport.requestFullscreen();
    }
  } catch (error) {
    // Keep app behavior stable if fullscreen is blocked by browser policy.
    console.error("Fullscreen toggle failed:", error);
  }
});

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
    default:
      break;
  }
});

document.addEventListener("fullscreenchange", updateFullscreenButtonLabel);

updateSpeedLabel();
updateFontSize();
updateMargins();
updateMirrorTransform();
updatePromptText();
updateFullscreenButtonLabel();
