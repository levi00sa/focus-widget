import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
let faceDetector = null;

// Initialize MediaPipe Face Detector
async function initFaceDetector() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
    },
    runningMode: "VIDEO"
  });

  console.log("FaceDetector ready");
}

let faceVisible = false;
async function detectFace() {
  if (!faceDetector || !video.videoWidth) return;
  const results = faceDetector.detectForVideo(
    video,
    performance.now()
  );
  faceVisible = results.detections.length > 0;
  if (faceVisible) {
    positionOverlay(results.detections[0].boundingBox);
  }
}

initFaceDetector();
// position the overlay icon above the detected face
function positionOverlay(face) {
  const videoRect = video.getBoundingClientRect();
  const scaleX = videoRect.width / video.videoWidth;
  const scaleY = videoRect.height / video.videoHeight;

  const centerX =
    (face.originX + face.width / 2) * scaleX;
  const foreheadY =
    (face.originY - face.height * 0.35) * scaleY;

  overlay.style.left = `${centerX}px`;
  overlay.style.top = `${foreheadY}px`;
  overlay.style.transform = "translate(-50%, -100%)";
  overlay.style.display = "block";
}
// retrieve saved mode from localStorage or default to IDLE
let currentMode = localStorage.getItem('currentMode') || 'IDLE';

// save current mode to localStorage to persist across sessions
function saveMode(mode) {
  localStorage.setItem('currentMode', mode);
}

// setup the camera feed
const video = document.getElementById("camera-feed"); 
const canvas = document.getElementById('canvas'); // offscreen canvas for capturing frames
const ctx = canvas.getContext('2d'); // 2D drawing context for the canvas
const overlay = document.getElementById('overlay'); // the status icon overlay
const toggleButton = document.getElementById('toggle-button'); // button to start/stop camera

let cameraOn = false;

// handle start/stop camera
// face detection loop
let faceLoopRunning = false;

function faceLoop(){
    if (!cameraOn) {
      faceLoopRunning = false;
      return;
    }
    faceLoopRunning = true;
    detectFace();
    requestAnimationFrame(faceLoop);
  }

toggleButton.addEventListener('click', async () => {
  if (!cameraOn) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
      cameraOn = true;
    video.onloadedmetadata = () => {
      video.play();
      console.log("Camera started");
      faceLoop();
    };
    toggleButton.textContent = "Stop";
  } else {
    video.srcObject?.getTracks().forEach(t => t.stop());
    video.srcObject = null;
    cameraOn = false;
    toggleButton.textContent = "Start";
  }
});
function captureFrame(){
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  console.log("Catured frame: ", canvas.width, canvas.height);
  console.log("Auto-detected mode:", currentMode);
  return canvas.toDataURL('image/png');
}
// == detecting mode ==

function applyOverlay(mode) {
  console.log("Applying overlay for mode:", mode);
  switch(mode) {
    case 'FOCUS':
      overlay.src = 'assets/focus.png';
      break;
    case 'BREAK':
      overlay.src = 'assets/break.png';
      break;
    default:
      overlay.src = 'assets/idle.png';
  }
  console.log("Overlay src set to:", overlay.src);
}

function downloadImage() {
  const imageData = captureFrame();
  const a = document.createElement('a');
  a.href = imageData;
  a.download = 'capture.png';
  a.click();
}

applyOverlay(currentMode);

document.getElementById('capture-button').addEventListener('click', () => {
  const imageData = captureFrame();
  // Run OCR on the captured image
  Tesseract.recognize(canvas, 'eng')
    .then(({ data: { text } }) => {
      const detectedMode = detectModeFromText(text);
      if (detectedMode !== 'IDLE') {
        currentMode = detectedMode;
        saveMode(currentMode);
        applyOverlay(currentMode);
      }
    });
});

function detectModeFromText(text) {
  const focusKeywords = ['focus', 'study', 'work'];
  const breakKeywords = ['break', 'rest', 'pause'];

  const lowerText = String(text ?? '').toLowerCase().trim();

  if (lowerText === '') {
    return 'IDLE';
  }
  if (focusKeywords.some(k => lowerText.includes(k))) {
    return 'FOCUS';
  }
  if (breakKeywords.some(k => lowerText.includes(k))) {
    return 'BREAK';
  }
  return null;
}

function updateMode(newMode){
  if (!newMode) return;;

  if (newMode !== currentMode) {
    currentMode = newMode;
    saveMode(currentMode);
    applyOverlay(currentMode);
    console.log("Auto-update mode: ", currentMode);
  }
}

// ===== Automatic OCR loop =====
let lastDetectedMode = 'IDLE';
let modeConfirmationCount = 0;

setInterval(() => {
  // Only run if camera is ON
  if (!video.srcObject) return;

  captureFrame();

  Tesseract.recognize(canvas, 'eng')
    .then(result => {
      console.log("Recognized text:", result.data.text);
      const detectedMode = detectModeFromText(result.data.text);
      
      if (detectedMode === lastDetectedMode) {
        modeConfirmationCount++;
        if (modeConfirmationCount >= 3) { //require 3 consecutive detections to update instead of changing immediately
          updateMode(detectedMode);
          modeConfirmationCount = 0; //reset after update
        }
      } else {
        lastDetectedMode = detectedMode;
        modeConfirmationCount = 1; // Start counting
      }
    });
}, 20000); //every 20 seconds

//TODO: Detect face and get face bounding box or landmarks
//TODO: Track the face and place the icon overlay to head

