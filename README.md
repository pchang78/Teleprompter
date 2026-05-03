# Teleprompter MVP

A lightweight web-based teleprompter built with plain HTML, CSS, and JavaScript.

## Features

- Paste long-form scripts into the input area
- **Scrolling modes** (choose under **Mode**):
  - **Fixed Speed**: steady auto-scroll with Start/Pause (Start is enabled only when script text exists)
  - **Automatic Scrolling**: uses the microphone and the browser Web Speech API to listen while you read, and tries to keep the viewport aligned with your place in the script. This feature is in its **initial state** and still needs refinement (accuracy, edge cases, and polish).
- Adjustable scroll speed for **Fixed Speed** mode (`10` to `300 px/s`; the speed control is inactive while **Automatic Scrolling** is selected)
- Font size controls
- Left and right margin controls
- Fullscreen teleprompter mode
- Dark mode toggle
- Mirror horizontally toggle
- Mirror vertically toggle (starts from bottom and scrolls in reverse)
- Keyboard shortcuts for live operation

## Project Structure

- `index.html` - App layout and controls
- `styles.css` - Visual styling and fullscreen presentation
- `app.js` - Teleprompter behavior and keyboard controls

## Run

No build tools are required.

1. Open `index.html` in your browser.
2. Paste your script into the **Script Input** box.
3. Choose **Fixed Speed** or **Automatic Scrolling** under **Mode**.
4. Press **Start** to begin. In **Automatic Scrolling**, grant microphone access when prompted; a **Listening…** indicator appears while recognition is active.

## Controls

### Buttons / Sliders

- **Mode**: **Fixed Speed** (constant scroll rate) or **Automatic Scrolling** (speech-driven; requires Web Speech API support and microphone permission)
- **Start / Pause**: Begin or pause scrolling (fixed speed) or speech recognition (automatic)
- **Fullscreen**: Expand teleprompter viewport to full screen
- **Speed slider**: Set scroll speed for **Fixed Speed** mode (`10` to `300 px/s`)
- **Left Margin / Right Margin**: Adjust text side spacing
- **A- / A+**: Decrease or increase font size
- **Dark Mode**: Toggle light/dark appearance
- **Mirror Horizontally**: Flip text left-to-right
- **Mirror Vertically**: Flip text top-to-bottom and reverse scroll direction

### Keyboard Shortcuts

- `Space`: Start / Stop
- `Arrow Up`: Scroll back a few lines
- `Arrow Down`: Scroll ahead a few lines
- `Arrow Left`: Decrease speed by `10 px/s`
- `Arrow Right`: Increase speed by `10 px/s`
- `<` / `>`: Decrease / increase both side margins by `10 px`
- `f`: Toggle fullscreen
- `v`: Toggle vertical mirror mode

Note: Keyboard shortcuts are ignored while typing in the script textarea.

## Notes

- **Automatic Scrolling** is experimental: expect rough matching, browser quirks, and behavior that will improve in future iterations.
- **Automatic Scrolling** needs a browser with the Web Speech API (for example Chrome, Edge, or Safari) and microphone access.
- If vertical mirror is enabled, the script starts at the bottom and scrolls upward (fixed-speed mode).
- Fullscreen behavior depends on browser Fullscreen API support and user permissions.
