document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const authSection = document.getElementById("auth-section");
    const statusSection = document.getElementById("status-section");
    const userDisplay = document.getElementById("user-display");
    const logoutBtn = document.getElementById("logout-btn");
    const errorMsg = document.getElementById("error-msg");

    function showError(msg) {
        errorMsg.innerText = msg;
        errorMsg.style.display = "block";
    }

    function clearError() {
        errorMsg.innerText = "";
        errorMsg.style.display = "none";
    }

    const checkAuth = async () => {
        const data = await chrome.storage.local.get(["user", "token"]);
        if (data.user && data.token) {
            authSection.style.display = "none";
            statusSection.style.display = "block";
            initSettings();
        } else {
            authSection.style.display = "block";
            statusSection.style.display = "none";
        }
    };

    const recordBtn = document.getElementById("record-btn");
    const badge = document.getElementById("recording-badge");
    const badgeText = document.getElementById("recording-text");
    const badgeDot = document.getElementById("recording-dot");
    const toggles = {
        mouse: document.getElementById("toggle-mouse"),
        scroll: document.getElementById("toggle-scroll"),
        eye: document.getElementById("toggle-eye")
    };
    let isRecording = false;

    async function initSettings() {
        const data = await chrome.storage.local.get(["settings", "isRecording"]);
        const settings = data.settings || { mouse: true, scroll: true, eye: true };
        toggles.mouse.checked = settings.mouse;
        toggles.scroll.checked = settings.scroll;
        toggles.eye.checked = settings.eye;
        isRecording = !!data.isRecording;
        updateRecordingUI();
    }

    function updateRecordingUI() {
        if (isRecording) {
            recordBtn.innerText = "Stop Recording";
            recordBtn.style.background = "#ef4444"; // red
            badgeText.innerText = "Recording...";
            badgeText.style.color = "#ef4444";
            badgeDot.style.background = "#ef4444";
            badge.style.borderColor = "rgba(239, 68, 68, 0.3)";
        } else {
            recordBtn.innerText = "Start Recording";
            recordBtn.style.background = "#3b82f6"; // blue
            badgeText.innerText = "Ready to Record";
            badgeText.style.color = "#10b981";
            badgeDot.style.background = "#10b981";
            badge.style.borderColor = "#334155";
        }
    }

    // Save toggle config changes instantly
    async function saveSettings() {
        const settings = {
            mouse: toggles.mouse.checked,
            scroll: toggles.scroll.checked,
            eye: toggles.eye.checked
        };
        await chrome.storage.local.set({ settings });
    }

    toggles.mouse.addEventListener("change", saveSettings);
    toggles.scroll.addEventListener("change", saveSettings);
    toggles.eye.addEventListener("change", saveSettings);

    recordBtn.addEventListener("click", async () => {
        isRecording = !isRecording;
        await chrome.storage.local.set({ isRecording });
        updateRecordingUI();
        if (isRecording) {
            // Signal background to prep an empty session buffer if needed
            chrome.runtime.sendMessage({ type: "START_TRACKING" });
        } else {
            chrome.runtime.sendMessage({ type: "STOP_TRACKING" });
        }
    });

    async function authenticate(endpoint, btn) {
        clearError();
        const email = emailInput.value;
        const password = passwordInput.value;
        if (!email || !password) {
            showError("Email and password needed.");
            return;
        }

        const oldText = btn.innerText;
        btn.innerText = "Loading...";
        btn.disabled = true;

        try {
            const res = await fetch(`http://localhost:3001/auth/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            // Handle HTTP 401 Unauthorized exceptions manually here
            if (res.status === 401) {
                showError("Invalid credentials.");
                return;
            }

            const result = await res.json();
            if (result.token) {
                await chrome.storage.local.set({ user: result.user, token: result.token });
                checkAuth();
            } else {
                showError(endpoint === 'login' ? "Login failed: " + result.message : "Registration failed: " + result.message);
            }
        } catch (err) {
            console.error(err);
            showError("Backend is offline. Must run NestJS server.");
        } finally {
            btn.innerText = oldText;
            btn.disabled = false;
        }
    }

    loginBtn.addEventListener("click", () => authenticate("login", loginBtn));
    registerBtn.addEventListener("click", () => authenticate("register", registerBtn));

    logoutBtn.addEventListener("click", async () => {
        // Send session stop to backend securely
        const data = await chrome.storage.local.get(["sessionId", "token"]);
        if (data.sessionId && data.token) {
            try {
                await fetch("http://localhost:3001/track/session/end", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${data.token}`
                    },
                    body: JSON.stringify({ sessionId: data.sessionId })
                });
            } catch (e) { }
            await chrome.storage.local.remove("sessionId");
        }
        await chrome.storage.local.remove(["user", "token"]);
        checkAuth();
    });

    checkAuth();
});
