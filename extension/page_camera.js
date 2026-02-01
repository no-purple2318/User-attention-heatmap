console.log("[PageCamera] active");

(async () => {
  const video = document.createElement("video");
  video.setAttribute("playsinline", "");
  video.style.display = "none";
  document.documentElement.appendChild(video);

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }
  });

  video.srcObject = stream;
  await video.play();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  function sendFrame() {
    if (video.videoWidth === 0) {
      requestAnimationFrame(sendFrame);
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

    requestAnimationFrame(sendFrame);
  }

  sendFrame();
})();
