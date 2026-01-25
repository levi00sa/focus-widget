let currentMode = localStorage.getItem('currentMode') || 'IDLE';

function saveMode(mode) {
  localStorage.setItem('currentMode', mode);
}

const video = document.getElementById("camera-feed");

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(err => console.error("Camera access denied:", err));

const overlay = document.getElementById('overlay');

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

function captureImage() {
  const canvas = document.getElementById('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const imageData = canvas.toDataURL('image/png');
  return imageData;
}

function downloadImage() {
  const imageData = captureImage();
  const a = document.createElement('a');
  a.href = imageData;
  a.download = 'capture.png';
  a.click();
}

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

// Initialize overlay on load
applyOverlay(currentMode);

// Add event listeners
document.getElementById('toggle-button').addEventListener('click', toggleMode);
document.getElementById('capture-button').addEventListener('click', () => {
  const imageData = captureImage();
  // Run OCR on the captured image
  Tesseract.recognize(document.getElementById('canvas'), 'eng').then(result => {
    console.log('OCR Result:', result.text);
    // TODO: Implement focus detection logic based on OCR text
  }).catch(err => console.error('OCR Error:', err));
});
document.getElementById('download-button').addEventListener('click', downloadImage);
document.getElementById('delete-button').addEventListener('click', deleteImage);
document.getElementById('save-button').addEventListener('click', saveImage);
document.getElementById('share-button').addEventListener('click', shareImage);
