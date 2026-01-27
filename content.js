const CELL_SIZE = 50;
let heatmap = {};
let maxValue = 0;

// --- state ---
let enabled = false;

// --- canvas setup ---
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

// --- draw attention ---
document.addEventListener("mousemove", (e) => {
  if (!enabled) return;

  const x = Math.floor(e.pageX / CELL_SIZE);
  const y = Math.floor(e.pageY / CELL_SIZE);
  const key = `${x},${y}`;

  heatmap[key] = (heatmap[key] || 0) + 1;
  maxValue = Math.max(maxValue, heatmap[key]);
});



// --- message listener ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_HEATMAP") {
    enabled = !enabled;
    canvas.style.display = enabled ? "block" : "none";
  }
});

function renderHeatmap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const key in heatmap) {
    const [x, y] = key.split(",").map(Number);
    const value = heatmap[key];

    const intensity = value / maxValue;

    const radius = CELL_SIZE;
    const cx = x * CELL_SIZE + CELL_SIZE / 2;
    const cy = y * CELL_SIZE + CELL_SIZE / 2;

    const gradient = ctx.createRadialGradient(
      cx, cy, 0,
      cx, cy, radius
    );

    gradient.addColorStop(0, `rgba(255,0,0,${intensity})`);
    gradient.addColorStop(1, "rgba(255,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(
      x * CELL_SIZE,
      y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    );
  }
}

setInterval(() => {
  if (enabled) renderHeatmap();
}, 200);
