// inject camera script
(() => {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("page_camera.js");
  document.documentElement.appendChild(s);
})();

// inject gaze/mesh script
(() => {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("gaze.js");
  document.documentElement.appendChild(s);
})();
(() => {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("face_mesh.js");
  document.documentElement.appendChild(s);
})();

let isRecording = false;
let trackingSettings = { mouse: true, scroll: true, eye: true };

chrome.storage.local.get(["isRecording", "trackingSettings"], (data) => {
  isRecording = !!data.isRecording;
  if (data.trackingSettings) trackingSettings = data.trackingSettings;

  if (isRecording && trackingSettings.eye) {
    window.postMessage({ action: "START_CAMERA" }, "*");
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "RESUME_TRACKING") {
    isRecording = true;
    if (trackingSettings.eye) {
      window.postMessage({ action: "START_CAMERA" }, "*");
    }
  } else if (msg.action === "PAUSE_TRACKING") {
    isRecording = false;
    window.postMessage({ action: "STOP_CAMERA" }, "*");
  }
  chrome.storage.local.get(["trackingSettings"], data => {
    if (data.trackingSettings) trackingSettings = data.trackingSettings;
    if (isRecording && trackingSettings.eye) {
      window.postMessage({ action: "START_CAMERA" }, "*");
    } else if (isRecording && !trackingSettings.eye) {
      window.postMessage({ action: "STOP_CAMERA" }, "*");
    }
  });
});

function recordEvent(type, x, y) {
  if (!isRecording) return;
  chrome.runtime.sendMessage({
    action: "RECORD_EVENT",
    data: { t: Date.now(), type, x, y }
  });
}

function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Track Mouse (~10 fps)
window.addEventListener("mousemove", throttle((e) => {
  if (trackingSettings.mouse) {
    // Normalize x/y to 0-1 based on window size
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    recordEvent("MOUSE", x, y);
  }
}, 100));

// Track Scroll (~10 fps)
window.addEventListener("scroll", throttle(() => {
  if (trackingSettings.scroll) {
    const x = window.scrollX / document.body.scrollWidth;
    const y = window.scrollY / document.body.scrollHeight;
    recordEvent("SCROLL", x, y);
  }
}, 100), { passive: true });

// Track Eye via postMessage bridge (gaze.js runs in page world, content.js in isolated world)
// They cannot share window variables, so gaze.js broadcasts via postMessage.
let lastGazeTime = 0;
window.addEventListener("message", (e) => {
  // Filter to only messages from the same page (not iframes or other origins)
  if (e.source !== window) return;
  if (e.data?.type !== "GAZE_DATA") return;
  if (!isRecording || !trackingSettings.eye) return;

  // Throttle to ~10fps
  const now = Date.now();
  if (now - lastGazeTime < 100) return;
  lastGazeTime = now;

  // Apply calibration offset if available
  chrome.storage.local.get(["calibrationOffsets"], (data) => {
    let x = e.data.x;
    let y = e.data.y;

    if (data.calibrationOffsets) {
      x += data.calibrationOffsets.x;
      y += data.calibrationOffsets.y;
    }

    // Keep within bounds [0, 1]
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    recordEvent("EYE", x, y);
  });
});

