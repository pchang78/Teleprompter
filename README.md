# Teleprompter MVP

A lightweight web-based teleprompter built with plain HTML, CSS, and JavaScript.

## Features

- Paste long-form scripts into the input area
- Auto-scroll with Start/Pause control
- Adjustable scroll speed (`10` to `300 px/s`)
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
3. Press **Start** to begin scrolling.

## Controls

### Buttons / Sliders

- **Start / Pause**: Toggle auto-scroll
- **Fullscreen**: Expand teleprompter viewport to full screen
- **Speed slider**: Set scroll speed (`10` to `300 px/s`)
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

Note: Keyboard shortcuts are ignored while typing in the script textarea.

## Notes

- If vertical mirror is enabled, the script starts at the bottom and scrolls upward.
- Fullscreen behavior depends on browser Fullscreen API support and user permissions.
