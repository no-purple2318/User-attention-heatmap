let stream = null;
let animationId = null;
const video = document.createElement("video");
video.setAttribute("playsinline", "");
video.style.display = "none";
document.documentElement.appendChild(video);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

async function startCamera() {
  if (stream) return; // already running
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });
    video.srcObject = stream;
    await video.play();
    sendFrame();
  } catch (err) {
    console.error("Camera permissions denied or failed", err);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  video.srcObject = null;
}

function sendFrame() {
  if (!stream) return;

  if (video.videoWidth === 0) {
    animationId = requestAnimationFrame(sendFrame);
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

  window.postMessage(
    {
      type: "WEBCAM_FRAME",
      width: canvas.width,
      height: canvas.height,
      data: img.data
    },
    "*"
  );

  animationId = requestAnimationFrame(sendFrame);
}

window.addEventListener("message", (event) => {
  if (event.data && event.data.action === "START_CAMERA") {
    startCamera();
  } else if (event.data && event.data.action === "STOP_CAMERA") {
    stopCamera();
  }
});
