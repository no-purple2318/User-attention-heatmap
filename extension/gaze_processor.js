console.log("[GazeProcessor] running");

/* Inject camera script */
(function injectCamera() {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("page_camera.js");
  document.documentElement.appendChild(s);
})();

/* Load MediaPipe */
const mp = document.createElement("script");
mp.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
mp.crossOrigin = "anonymous";
document.head.appendChild(mp);

let pendingFrame = null;

window.addEventListener("message", (e) => {
  if (e.data?.type === "WEBCAM_FRAME") {
    pendingFrame = e.data;
  }
});

mp.onload = () => {
  const faceMesh = new FaceMesh({
    locateFile: (f) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  const RIGHT_EYE = [
    362, 382, 381, 380, 374, 373, 390, 249,
    263, 466, 388, 387, 386, 385, 384, 398
  ];
  const RIGHT_IRIS = [472, 473, 474, 475];

  function avg(indices, lm) {
    let x = 0, y = 0, c = 0;
    indices.forEach(i => {
      if (!lm[i]) return;
      x += lm[i].x;
      y += lm[i].y;
      c++;
    });
    return c ? { x: x / c, y: y / c } : null;
  }

  function box(indices, lm) {
    let minX = 1, maxX = 0, minY = 1, maxY = 0, ok = false;
    indices.forEach(i => {
      if (!lm[i]) return;
      ok = true;
      minX = Math.min(minX, lm[i].x);
      maxX = Math.max(maxX, lm[i].x);
      minY = Math.min(minY, lm[i].y);
      maxY = Math.max(maxY, lm[i].y);
    });
    return ok ? { minX, maxX, minY, maxY } : null;
  }

  faceMesh.onResults((res) => {
    if (!res.multiFaceLandmarks) return;
    const lm = res.multiFaceLandmarks[0];

    const eyeBox = box(RIGHT_EYE, lm);
    const iris = avg(RIGHT_IRIS, lm);
    if (!eyeBox || !iris) return;

    const nx =
      (iris.x - eyeBox.minX) / (eyeBox.maxX - eyeBox.minX);
    const ny =
      (iris.y - eyeBox.minY) / (eyeBox.maxY - eyeBox.minY);

    window.__GAZE__ = {
      x: Math.max(0, Math.min(1, nx)),
      y: Math.max(0, Math.min(1, ny)),
      t: Date.now()
    };
  });

  async function loop() {
    if (pendingFrame) {
      const img = new ImageData(
        new Uint8ClampedArray(pendingFrame.data),
        pendingFrame.width,
        pendingFrame.height
      );
      await faceMesh.send({ image: img });
      pendingFrame = null;
    }
    requestAnimationFrame(loop);
  }

  loop();
};
