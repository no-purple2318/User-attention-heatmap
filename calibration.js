document.getElementById('start-btn').addEventListener('click', startCalibration);

const points = ['pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-5'];
let currentPointIdx = 0;
let rawGazeCoordinates = []; // { x, y } predicted by gaze.js

function startCalibration() {
    document.getElementById('instructions').style.display = 'none';

    // Start camera (which triggers face_mesh and gaze.js)
    window.postMessage({ action: "START_CAMERA" }, "*");

    // Wait a brief moment for camera to warm up, then show first point
    setTimeout(() => {
        showPoint(currentPointIdx);
    }, 1500);
}

function showPoint(idx) {
    if (idx < points.length) {
        document.getElementById(points[idx]).style.display = 'block';
        document.getElementById(points[idx]).addEventListener('click', handlePointClick, { once: true });
    } else {
        finishCalibration();
    }
}

function handlePointClick(e) {
    // Hide current point
    document.getElementById(points[currentPointIdx]).style.display = 'none';

    // Read the current raw prediction from gaze.js
    if (window.__HEAD__) {
        rawGazeCoordinates.push({
            x: window.__HEAD__.x,
            y: window.__HEAD__.y,
            targetX: e.clientX / window.innerWidth,
            targetY: e.clientY / window.innerHeight
        });
    } else {
        // Fallback if gaze.js isn't ready
        rawGazeCoordinates.push({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
    }

    currentPointIdx++;

    // Delay slightly to ensure user follows next dot
    setTimeout(() => {
        showPoint(currentPointIdx);
    }, 500);
}

function finishCalibration() {
    // Stop camera
    window.postMessage({ action: "STOP_CAMERA" }, "*");

    document.getElementById('finish-msg').style.display = 'block';

    // Calculate simple offset/scale (Averaging the errors)
    let offsetX = 0;
    let offsetY = 0;

    if (rawGazeCoordinates.length > 0) {
        rawGazeCoordinates.forEach(data => {
            offsetX += (data.targetX - data.x);
            offsetY += (data.targetY - data.y);
        });

        offsetX /= rawGazeCoordinates.length;
        offsetY /= rawGazeCoordinates.length;
    }

    // Save offsets to Chrome storage to be used by content.js
    chrome.storage.local.set({
        calibrationOffsets: { x: offsetX, y: offsetY }
    });
}
