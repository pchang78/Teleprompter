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
let preciseScrollTop = 0;
let fontSize = 42;
let leftMargin = Number(leftMarginSlider.value);
let rightMargin = Number(rightMarginSlider.value);

const MIN_FONT_SIZE = 24;
const MAX_FONT_SIZE = 90;
const SCROLL_JUMP_LINES = 3;

// Keep fullscreen button text in sync with actual browser state.
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
    setViewportScrollTop(0);
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
  // Fall back to a readable default if computed line-height is "normal".
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

function scrollLoop(timestamp) {
  if (!isScrolling) {
    return;
  }

  // Initialize on first frame to avoid a large initial time delta.
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  const elapsedSeconds = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  const maxScrollTop = getMaxScrollTop();
  // Vertical mirror mode scrolls upward, so direction is inverted.
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

  // Start from the bottom when vertically mirrored so text moves toward the top.
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

  // Reset position when direction changes to keep expected reading flow.
  stopScrolling();
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
    // Keep app behavior stable if fullscreen is blocked by browser policy.
    console.error("Fullscreen toggle failed:", error);
  }
}

fullscreenBtn.addEventListener("click", toggleFullscreen);

document.addEventListener("keydown", (event) => {
  // Avoid hijacking typing shortcuts while user is editing script text.
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
      // Shift+, on US keyboards.
      adjustMargins(-10);
      break;
    case ">":
      event.preventDefault();
      // Shift+. on US keyboards.
      adjustMargins(10);
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

document.addEventListener("fullscreenchange", updateFullscreenButtonLabel);

updateSpeedLabel();
updateFontSize();
updateMargins();
updateMirrorTransform();
updatePromptText();
updateFullscreenButtonLabel();
