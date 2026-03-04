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
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "RESUME_TRACKING") {
    isRecording = true;
  } else if (msg.action === "PAUSE_TRACKING") {
    isRecording = false;
  }
  chrome.storage.local.get(["trackingSettings"], data => {
    if (data.trackingSettings) trackingSettings = data.trackingSettings;
  })
});

function recordEvent(type, x, y) {
  if (!isRecording) return;
  chrome.runtime.sendMessage({
    action: "RECORD_EVENT",
    data: { t: Date.now(), type, x, y }
  });
}

// Track Mouse
window.addEventListener("mousemove", (e) => {
  if (trackingSettings.mouse) {
    // Normalize x/y to 0-1 based on window size
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    // Throttle slightly or record depending on needs. (We'll capture raw for now)
    recordEvent("MOUSE", x, y);
  }
});

// Track Scroll
window.addEventListener("scroll", () => {
  if (trackingSettings.scroll) {
    const x = window.scrollX / document.body.scrollWidth;
    const y = window.scrollY / document.body.scrollHeight;
    recordEvent("SCROLL", x, y);
  }
}, { passive: true });

// Track Eye (Polled via requestAnimationFrame)
function pollEyeTracking() {
  if (isRecording && trackingSettings.eye && window.__HEAD__) {
    // gaze.js sets window.__HEAD__
    recordEvent("EYE", window.__HEAD__.x, window.__HEAD__.y);
  }
  requestAnimationFrame(pollEyeTracking);
}
pollEyeTracking();

