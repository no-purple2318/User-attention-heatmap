let isRecording = false;
let settings = { mouse: true, scroll: true, eye: true };

chrome.storage.local.get(["settings", "isRecording"], (data) => {
    if (data.settings) settings = data.settings;
    if (data.isRecording !== undefined) isRecording = data.isRecording;
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) settings = changes.settings.newValue;
    if (changes.isRecording) isRecording = changes.isRecording.newValue;
});

// Setup a listener for user activity
function trackEvent(type, x, y) {
    if (!isRecording) return;
    const timestamp = new Date().toISOString();
    // We send it off to background.js
    chrome.runtime.sendMessage({
        type: "TRACK_EVENT",
        payload: {
            timestamp,
            type,
            x,
            y,
            url: window.location.href, // Capturing specific URL too
        }
    }).catch(() => { /* ignore error when extension is reloaded */ });
}

// Throttle configuration
let lastEventTime = 0;
const THROTTLE_MS = 50; // Increased to 20Hz max volume

document.addEventListener("mousemove", (e) => {
    if (!settings.mouse) return;
    const now = Date.now();
    if (now - lastEventTime > THROTTLE_MS) {
        trackEvent("mouse", e.clientX, e.clientY);
        lastEventTime = now;
    }
});

// Capture Scrolls
document.addEventListener("scroll", () => {
    if (!settings.scroll) return;
    const now = Date.now();
    if (now - lastEventTime > THROTTLE_MS) {
        // Save scroll percentages or coordinates
        trackEvent("scroll", window.scrollX, window.scrollY);
        lastEventTime = now;
    }
});

console.log("Attention Tracker Content Script Loaded.");
