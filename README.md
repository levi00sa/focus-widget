# Focus Widget

A web-based focus tracking widget that uses your camera to detect your current activity mode (Focus, Break, or Idle) via OCR text recognition and positions a status icon on your face using face detection.

## Features

- **Real-time Mode Detection**: Automatically detects "Focus", "Break", or "Idle" modes by reading text in your camera feed using OCR.
- **Face Tracking**: Uses MediaPipe Face Detection to position the status icon above your forehead.
- **Persistent Modes**: Saves the current mode to localStorage for session persistence.
- **Manual Capture**: Button to manually capture and analyze a frame for mode detection.
- **Camera Control**: Toggle button to start/stop the camera feed.
- **Confirmation Logic**: Requires 3 consecutive OCR detections to confirm mode changes, preventing false positives.

## Technologies Used

- **JavaScript**: Core logic
- **HTML/CSS**: UI structure and styling
- **Tesseract.js**: Optical Character Recognition (OCR) for text detection
- **MediaPipe Tasks Vision**: Face detection and tracking
- **Canvas API**: Frame capture and processing

## Setup

1. **Clone or Download** the project files to your local machine.

2. **File Structure**:
   ```
   focus-widget/
   ├── script.js          # Main JavaScript file
   ├── style.css          # CSS styles
   ├── index.html         # HTML structure (assumed)
   ├── assets/            # Folder for icon images
   │   ├── focus.png
   │   ├── break.png
   │   └── idle.png
   └── README.md          # This file
   ```

3. **Dependencies**:
   - The project uses CDN links for Tesseract.js and MediaPipe, so no additional installation is needed.
   - Ensure you have the `assets` folder with the required PNG icons.

4. **Permissions**:
   - The app requires camera access. Grant permission when prompted by the browser.

## Usage

1. Open `index.html` in a modern web browser (Chrome recommended for best MediaPipe support).

2. Click the "Start" button to enable the camera.

3. Show text like "FOCUS", "BREAK", or related keywords to the camera. The app will automatically detect and update the mode after confirmation.

4. The status icon will appear at the top of the screen initially, then reposition to above your face if detected.

5. Use the "Capture" button for manual mode detection on demand.

6. The mode persists across page reloads.

## How It Works

- **OCR Detection**: Every 20 seconds, the app captures a frame from the camera, runs OCR using Tesseract.js, and checks for keywords to determine the mode.
- **Confirmation**: To avoid flickering, the mode only updates after the same mode is detected in 3 consecutive scans.
- **Face Positioning**: MediaPipe detects faces in the video feed and positions the overlay icon dynamically.
- **Fallback**: If no face is detected, the icon stays at a default position (top center).

## Browser Compatibility

- Works best in Chrome and other Chromium-based browsers due to MediaPipe support.
- Requires HTTPS or localhost for camera access.

## Troubleshooting

- **Camera not starting**: Ensure camera permissions are granted and no other app is using the camera.
- **OCR not detecting text**: Ensure good lighting, clear text, and hold the text steady in the camera view.
- **Icons not showing**: Check that the `assets` folder and PNG files exist with correct paths.
- **Face not detected**: Ensure your face is well-lit and in the camera frame.

## Future Improvements

- Add more keywords or customizable detection rules.
- Improve OCR accuracy with image preprocessing.
- Add audio cues or notifications for mode changes.
- Support for multiple faces or better positioning logic.

## License

This project is open-source. Feel free to modify and distribute.
