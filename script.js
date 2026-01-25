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


toggleButton.addEventListener('click', async () => {
  if (!cameraOn) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      console.log("Camera started");
    };
    cameraOn = true;
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
/*
async function performOCR(imageData) {
  if (!cameraOn) return;
  captureFrame();
  const { data: {text}} = await Tesseract.recognize(canvas, 'eng');
  console.log("OCR Result:", text);
  const detectedMode = detectModeFromText(text);
  if (detectedMode !== 'IDLE') {
    currentMode = detectedMode;
    saveMode(currentMode);
    applyOverlay(currentMode);
  }
}
*/
// == detecting mode ==

function applyOverlay(mode) {
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
}
/*
function toggleMode() {
  if (currentMode === 'IDLE') {
    currentMode = 'FOCUS';
  } else if (currentMode === 'FOCUS') {
    currentMode = 'BREAK';
  } else {
    currentMode = 'IDLE';
  }
  saveMode(currentMode);
  applyOverlay(currentMode);
  
  // Manage camera based on mode
  if (currentMode === 'FOCUS' || currentMode === 'BREAK') {
    if (!video.srcObject) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { video.srcObject = stream; })
        .catch(err => console.error("Camera access denied:", err));
    }
  } else {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  }
}
*/
function downloadImage() {
  const imageData = captureFrame();
  const a = document.createElement('a');
  a.href = imageData;
  a.download = 'capture.png';
  a.click();
}
/*
function deleteImage() {
  const canvas = document.getElementById('canvas');
  canvas.width = 0;
  canvas.height = 0;
}

function saveImage() {
  const imageData = captureImage();
  localStorage.setItem('lastImage', imageData);
}

function shareImage() {
  const imageData = captureImage();
  const a = document.createElement('a');
  a.href = imageData;
  a.download = 'capture.png';
  a.click();
}
*/
// Initialize overlay on load
applyOverlay(currentMode);

// Add event listeners
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
  const focusKeywords = ['work', 'study', 'focus'];
  const breakKeywords = ['rest', 'break', 'pause'];

  const lowerText = text.toLowerCase();
  if (focusKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'FOCUS';
  } else if (breakKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'BREAK';
  }
  return 'IDLE';
}

// ===== Automatic OCR loop =====
setInterval(() => {
  // Only run if camera is ON
  if (!video.srcObject) return;

  captureFrame();

  Tesseract.recognize(canvas, 'eng')
    .then(result => {
      console.log("Recognized text:", result.data.text);
      const mode = detectModeFromText(result.data.text);

      currentMode = mode;
      saveMode(mode);
      applyOverlay(mode);

      console.log("Auto-detected mode:", mode);
    });
}, 2000); //every 2 seconds