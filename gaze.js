// load MediaPipe FaceMesh
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

  faceMesh.onResults((res) => {
    if (!res.multiFaceLandmarks || res.multiFaceLandmarks.length === 0) {
      return;
    }

    const lm = res.multiFaceLandmarks[0];

    // Guard: nose landmark must exist
    if (!lm || !lm[1]) {
      return;
    }

    const nose = lm[1];

    // Broadcast gaze data via postMessage so content.js (isolated world) can receive it
    window.postMessage({
      type: "GAZE_DATA",
      x: nose.x,
      y: nose.y,
      t: Date.now()
    }, "*");
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
