import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
let faceDetector = null; // stats as null until WASM + model loads

// Initialize Tesseract worker once for reuse
let tesseractWorker = null;

async function initTesseractWorker() {
  tesseractWorker = await Tesseract.createWorker();
  await tesseractWorker.loadLanguage('eng');
  await tesseractWorker.initialize('eng');
  console.log("Tesseract worker ready");
}

async function initFaceDetector() {
  //load the MediaPipe Vision WASM files
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: { // load blaze face short range model
      modelAssetPath: 
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
    },
    runningMode: "VIDEO" //process video frames
  });

  console.log("FaceDetector ready");
}

initFaceDetector();
initTesseractWorker();
let faceVisible = false; // track whether a face is already detected
async function detectFace() {
  if (!faceDetector || !video.videoWidth) return;
  const results = faceDetector.detectForVideo(
    video,
    performance.now()
  );
  faceVisible = results.detections.length > 0; // check if any face is detected
  overlay.style.display = faceVisible ? "block" : "none"; // hide overlay if no face
  if (faceVisible) {
    positionOverlay(results.detections[0].boundingBox); // position overlay on first detected face
  }
}

// position the overlay icon above the detected face
let currentX = 0, currentY = 0;
const smoothingFactor = 0.2;

function positionOverlay(face) {
  const videoRect = video.getBoundingClientRect(); // get video element size and position
  const scaleX = videoRect.width / video.videoWidth; // calculate scale factors
  const scaleY = videoRect.height / video.videoHeight;

  const centerX = 
    (face.originX + face.width / 2) * scaleX; // face center horizontally
  const foreheadY =
    (face.originY - face.height * 0.35) * scaleY; // face center vertically

    // where lerp happens
  currentX = currentX * (1 - smoothingFactor) + centerX * smoothingFactor; 
  currentY = currentY * (1 - smoothingFactor) + foreheadY * smoothingFactor;

  // position the overlay above the face
  overlay.style.left = `${currentX}px`; // center horizontally
  overlay.style.top = `${currentY}px`; // position at forehead
  overlay.style.transform = "translate(-50%, -100%)"; // center horizontally, above vertically  
  overlay.style.display = "block"; // ensure overlay is visible
}

function positionOCRGuide() {
  const videoWidth = video.clientWidth;
  const videoHeight = video.clientHeight;
const width  = Math.min(videoWidth * 0.8, 280);
const height = Math.min(videoHeight * 0.3, 120);

  ocrGuide.style.left = `${videoWidth * 0.1}px`;
  ocrGuide.style.top  = `${videoHeight * 0.6}px`;
  ocrGuide.style.width = `${width}px`;
  ocrGuide.style.height = `${height}px`;
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
const ocrGuide = document.getElementById('ocr-guide'); // OCR positioning guide
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
      positionOCRGuide(); // position guide when video is ready
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

// Position OCR guide on resize and when video loads
window.addEventListener('resize', positionOCRGuide);
video.addEventListener('loadedmetadata', positionOCRGuide);

if (!ocrGuide.style.width) {
  positionOCRGuide();
}

function captureFrame() {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  const displayWidth = video.clientWidth;
  const displayHeight = video.clientHeight;

  // scale from displayed video → actual video resolution
  const scaleX = videoWidth / displayWidth;
  const scaleY = videoHeight / displayHeight;

  // OCR guide position (relative to video)
  const guideX = parseFloat(ocrGuide.style.left) * scaleX;
  const guideY = parseFloat(ocrGuide.style.top) * scaleY;
  const guideW = parseFloat(ocrGuide.style.width) * scaleX;
  const guideH = parseFloat(ocrGuide.style.height) * scaleY;

  // upscale for OCR
  canvas.width = guideW * 1.5;
  canvas.height = guideH * 1.5;

  ctx.save();
  ctx.setTransform(1.5, 0, 0, 1.5, 0, 0);
  ctx.filter = 'grayscale(100%) contrast(150%)';

  // 🔥 Crop ONLY the guide area
  ctx.drawImage(
    video,
    guideX,
    guideY,
    guideW,
    guideH,
    0,
    0,
    guideW,
    guideH
  );

  ctx.restore();

  return canvas;
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

document.getElementById('download-button').addEventListener('click', downloadImage);

applyOverlay(currentMode);

document.getElementById('capture-button').addEventListener('click', () => {
  const imageData = captureFrame();
  // Run OCR on the captured image using reused worker
  tesseractWorker.recognize(canvas)
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
  if (!newMode) return;

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

setInterval(async () => {
  if (!video.srcObject || !tesseractWorker || !faceVisible) return;

  captureFrame();

  const { data: { text } } = await tesseractWorker.recognize(canvas);
  const detectedMode = detectModeFromText(text);

  if (detectedMode === lastDetectedMode) {
    modeConfirmationCount++;
    if (modeConfirmationCount >= 3) {
      updateMode(detectedMode);
      modeConfirmationCount = 0;
    }
  } else {
    lastDetectedMode = detectedMode;
    modeConfirmationCount = 1;
  }
}, 20000);