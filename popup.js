const API_BASE = "http://localhost:3001";

document.addEventListener("DOMContentLoaded", async () => {
  const authView = document.getElementById("auth-view");
  const trackView = document.getElementById("track-view");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const toggleBtn = document.getElementById("toggle-record");
  const statusContainer = document.getElementById("status-container");
  const statusText = document.getElementById("status-text");
  const errorMsg = document.getElementById("login-error");

  const groupMouse = document.getElementById("group-mouse");
  const groupScroll = document.getElementById("group-scroll");
  const groupEye = document.getElementById("group-eye");

  const calibrateBtn = document.getElementById("calibrate-btn");
  if (calibrateBtn) {
    calibrateBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("calibration.html") });
    });
  }

  // Check login state
  chrome.storage.local.get(["userId", "isRecording", "trackingSettings"], (data) => {
    if (data.userId) {
      authView.style.display = "none";
      trackView.style.display = "block";
    }

    if (data.isRecording) {
      setRecordingState(true);
    }

    if (data.trackingSettings) {
      document.getElementById("track-mouse").checked = data.trackingSettings.mouse;
      document.getElementById("track-scroll").checked = data.trackingSettings.scroll;
      document.getElementById("track-eye").checked = data.trackingSettings.eye;
    }
  });

  function setRecordingState(isRecording) {
    if (isRecording) {
      toggleBtn.textContent = "Stop Recording";
      toggleBtn.className = "danger";
      statusContainer.classList.add("recording");
      statusText.textContent = "Recording Active";

      // Disable toggles while recording
      document.getElementById("track-mouse").disabled = true;
      document.getElementById("track-scroll").disabled = true;
      document.getElementById("track-eye").disabled = true;

      groupMouse.classList.add("disabled");
      groupScroll.classList.add("disabled");
      groupEye.classList.add("disabled");
    } else {
      toggleBtn.textContent = "Start Recording";
      toggleBtn.className = "primary";
      statusContainer.classList.remove("recording");
      statusText.textContent = "Ready to Record";

      // Enable toggles
      document.getElementById("track-mouse").disabled = false;
      document.getElementById("track-scroll").disabled = false;
      document.getElementById("track-eye").disabled = false;

      groupMouse.classList.remove("disabled");
      groupScroll.classList.remove("disabled");
      groupEye.classList.remove("disabled");
    }
  }

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (!email || !password) {
      errorMsg.textContent = "Please enter email and password";
      errorMsg.style.display = "block";
      return;
    }

    const originalText = loginBtn.textContent;
    loginBtn.textContent = "Connecting...";
    loginBtn.style.opacity = "0.7";
    loginBtn.disabled = true;
    errorMsg.style.display = "none";

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const json = await res.json();

      if (json.user && json.user.id) {
        chrome.storage.local.set({ userId: json.user.id }, () => {
          authView.style.opacity = "0";
          setTimeout(() => {
            authView.style.display = "none";
            trackView.style.display = "block";
            trackView.style.opacity = "0";
            setTimeout(() => {
              trackView.style.transition = "opacity 0.3s ease";
              trackView.style.opacity = "1";
            }, 50);
          }, 200);
        });
      } else {
        errorMsg.textContent = json.error || "Login failed";
        errorMsg.style.display = "block";
      }
    } catch (e) {
      errorMsg.textContent = "Error connecting to server.";
      errorMsg.style.display = "block";
    } finally {
      loginBtn.textContent = originalText;
      loginBtn.style.opacity = "1";
      loginBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["userId", "isRecording", "sessionId"], () => {
      trackView.style.opacity = "0";
      setTimeout(() => {
        trackView.style.display = "none";
        authView.style.display = "block";
        authView.style.opacity = "0";
        setTimeout(() => {
          authView.style.transition = "opacity 0.3s ease";
          authView.style.opacity = "1";
        }, 50);

        // reset fields
        document.getElementById("password").value = "";
        errorMsg.style.display = "none";
      }, 200);

      // Tell background to stop recording
      chrome.runtime.sendMessage({ action: "STOP_RECORDING" });
      setRecordingState(false);
    });
  });

  toggleBtn.addEventListener("click", () => {
    chrome.storage.local.get(["isRecording"], (data) => {
      const willRecord = !data.isRecording;

      const trackingSettings = {
        mouse: document.getElementById("track-mouse").checked,
        scroll: document.getElementById("track-scroll").checked,
        eye: document.getElementById("track-eye").checked,
      };

      chrome.storage.local.set({
        isRecording: willRecord,
        trackingSettings
      }, () => {
        setRecordingState(willRecord);
        if (willRecord) {
          chrome.runtime.sendMessage({ action: "START_RECORDING", settings: trackingSettings });
        } else {
          chrome.runtime.sendMessage({ action: "STOP_RECORDING" });
        }
      });
    });
  });

  // Save toggle states when they change
  ["track-mouse", "track-scroll", "track-eye"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      const trackingSettings = {
        mouse: document.getElementById("track-mouse").checked,
        scroll: document.getElementById("track-scroll").checked,
        eye: document.getElementById("track-eye").checked,
      };
      chrome.storage.local.set({ trackingSettings });
    });
  });
});
