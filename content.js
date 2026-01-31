//config 

const RADIUS = 30;              // radius of attention circle (px)
const POSITION_STEP = 10;       // quantization step (px)
const RENDER_INTERVAL = 200;    // ms
const TIME_INTERVAL = 100;      // ms

//state

let enabled = false;

let heatmap = {};               // { "x,y": accumulated_time_ms }
let maxValue = 0;

let currentPointKey = null;
let lastTime = null;

//CANVAS SETUP

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.style.position = "absolute";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.pointerEvents = "none";
canvas.style.zIndex = "999999";
canvas.style.display = "none";

document.documentElement.appendChild(canvas);

function resizeCanvas() {
  canvas.width = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", resizeCanvas);


//MOUSE TRACKING (STATE ONLY)

document.addEventListener("mousemove", (e) => {
  if (!enabled) return;

  // Quantize position to reduce key explosion
  const x = Math.round(e.pageX / POSITION_STEP) * POSITION_STEP;
  const y = Math.round(e.pageY / POSITION_STEP) * POSITION_STEP;

  currentPointKey = `${x},${y}`;
});

//TIME-WEIGHTED ATTENTION LOOP

setInterval(() => {
  if (!enabled || !currentPointKey) return;

  const now = Date.now();

  if (lastTime === null) {
    lastTime = now;
    return;
  }

  const delta = now - lastTime;

  heatmap[currentPointKey] =
    (heatmap[currentPointKey] || 0) + delta;

  maxValue = Math.max(maxValue, heatmap[currentPointKey]);

  lastTime = now;
}, TIME_INTERVAL);

// HEATMAP RENDERING (CIRCULAR)

function renderHeatmap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (maxValue === 0) return;

  for (const key in heatmap) {
    const [x, y] = key.split(",").map(Number);
    const value = heatmap[key];

    const intensity = value / maxValue;

    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, RADIUS
    );

    gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

setInterval(() => {
  if (enabled) renderHeatmap();
}, RENDER_INTERVAL);

//* EXTENSION MESSAGE HANDLER
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_HEATMAP") {
    enabled = !enabled;
    canvas.style.display = enabled ? "block" : "none";

    if (!enabled) {
      currentPointKey = null;
      lastTime = null;
    }
  }
});
