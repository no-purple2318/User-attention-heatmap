// load MediaPipe FaceMesh
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
script.crossOrigin = "anonymous";
document.head.appendChild(script);

let pendingFrame = null;

window.addEventListener("message", e => {
  if (e.data?.type === "WEBCAM_FRAME") {
    pendingFrame = e.data;
  }
});

script.onload = () => {
  const faceMesh = new FaceMesh({
    locateFile: f =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // Eye landmark indices (MediaPipe)
  const LEFT_EYE = [
    33, 133, 159, 145, 153, 154, 155, 133
  ];
  const RIGHT_EYE = [
    362, 263, 386, 374, 380, 381, 382, 362
  ];

  faceMesh.onResults(res => {
    if (!res.multiFaceLandmarks) return;

    const lm = res.multiFaceLandmarks[0];
    const points = [];

    [...LEFT_EYE, ...RIGHT_EYE].forEach(i => {
      if (lm[i]) points.push({ x: lm[i].x, y: lm[i].y });
    });

    window.__EYE_LANDMARKS__ = points;
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
