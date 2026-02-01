const POSITION_STEP = 10;
const TIME_INTERVAL = 100;

let currentMouse = null;
let lastTime = null;

/* Storage helper */
function recordEvent(event) {
  chrome.storage.local.get({ attentionEvents: [] }, (res) => {
    const events = res.attentionEvents;
    events.push(event);
    chrome.storage.local.set({ attentionEvents: events });
  });
}

/* Mouse tracking */
document.addEventListener("mousemove", (e) => {
  const x =
    Math.round(e.pageX / POSITION_STEP) * POSITION_STEP;
  const y =
    Math.round(e.pageY / POSITION_STEP) * POSITION_STEP;
  currentMouse = { x, y };
});

/* Time loop */
setInterval(() => {
  const now = Date.now();
  if (lastTime === null) {
    lastTime = now;
    return;
  }

  const delta = now - lastTime;
  lastTime = now;

  /* Mouse event */
  if (currentMouse) {
    recordEvent({
      timestamp: now,
      url: location.href,
      type: "mouse",
      x: currentMouse.x / document.documentElement.scrollWidth,
      y: currentMouse.y / document.documentElement.scrollHeight,
      duration: delta
    });
  }

  /* Gaze event */
  if (window.__GAZE__) {
    recordEvent({
      timestamp: now,
      url: location.href,
      type: "gaze",
      x: window.__GAZE__.x,
      y: window.__GAZE__.y,
      duration: delta
    });
  }
}, TIME_INTERVAL);
