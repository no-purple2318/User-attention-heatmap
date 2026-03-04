const API_BASE = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const authView = document.getElementById("auth-view");
  const trackView = document.getElementById("track-view");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const toggleBtn = document.getElementById("toggle-record");
  const statusText = document.getElementById("status-text");

  // Check login state
  chrome.storage.local.get(["token", "isRecording", "trackingSettings"], (data) => {
    if (data.token) {
      authView.style.display = "none";
      trackView.style.display = "block";
    }

    if (data.isRecording) {
      toggleBtn.textContent = "Stop Recording";
      toggleBtn.className = "danger";
      statusText.textContent = "Recording...";
      statusText.style.color = "red";
    }

    if (data.trackingSettings) {
      document.getElementById("track-mouse").checked = data.trackingSettings.mouse;
      document.getElementById("track-scroll").checked = data.trackingSettings.scroll;
      document.getElementById("track-eye").checked = data.trackingSettings.eye;
    }
  });

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const json = await res.json();

      if (json.token) {
        chrome.storage.local.set({ token: json.token }, () => {
          authView.style.display = "none";
          trackView.style.display = "block";
        });
      } else {
        alert(json.error || "Login failed");
      }
    } catch (e) {
      alert("Error connecting to server.");
    }
  });

  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["token", "isRecording", "sessionId"], () => {
      authView.style.display = "block";
      trackView.style.display = "none";

      // Tell background to stop recording
      chrome.runtime.sendMessage({ action: "STOP_RECORDING" });
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
        if (willRecord) {
          toggleBtn.textContent = "Stop Recording";
          toggleBtn.className = "danger";
          statusText.textContent = "Recording...";
          statusText.style.color = "red";
          chrome.runtime.sendMessage({ action: "START_RECORDING", settings: trackingSettings });
        } else {
          toggleBtn.textContent = "Start Recording";
          toggleBtn.className = "primary";
          statusText.textContent = "Ready";
          statusText.style.color = "#333";
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
