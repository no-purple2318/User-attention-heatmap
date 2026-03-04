const API_BASE = "http://localhost:3000/api";
let currentSessionId = null;
let eventBuffer = [];
let uploadInterval = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "START_RECORDING") {
        startSession(sender.tab?.url || "unknown");
    } else if (message.action === "STOP_RECORDING") {
        stopSession();
    } else if (message.action === "RECORD_EVENT") {
        eventBuffer.push(message.data);
    }
});

async function startSession(url) {
    const { token, isRecording } = await chrome.storage.local.get(["token", "isRecording"]);
    if (!token || !isRecording) return;

    try {
        const res = await fetch(`${API_BASE}/track/session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ url })
        });

        if (res.ok) {
            const data = await res.json();
            currentSessionId = data.sessionId;
            chrome.storage.local.set({ sessionId: currentSessionId });

            // Start ingestion loop
            if (uploadInterval) clearInterval(uploadInterval);
            uploadInterval = setInterval(flushBuffer, 5000);

            // Tell content script to begin listening
            broadcastToTabs({ action: "RESUME_TRACKING" });
        }
    } catch (e) {
        console.error("Failed to start session", e);
    }
}

function stopSession() {
    chrome.storage.local.remove(["sessionId"]);
    currentSessionId = null;
    flushBuffer();
    if (uploadInterval) clearInterval(uploadInterval);
    uploadInterval = null;
    broadcastToTabs({ action: "PAUSE_TRACKING" });
}

async function flushBuffer() {
    if (eventBuffer.length === 0 || !currentSessionId) return;

    const eventsToSend = [...eventBuffer];
    eventBuffer = []; // clear buffer early to not miss new events

    try {
        await fetch(`${API_BASE}/track/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId: currentSessionId,
                events: eventsToSend
            })
        });
    } catch (e) {
        console.error("Failed to upload events", e);
        // Push them back to the front of the queue if failed
        eventBuffer.unshift(...eventsToSend);
    }
}

function broadcastToTabs(msg) {
    chrome.tabs.query({}, tabs => {
        tabs.forEach(t => chrome.tabs.sendMessage(t.id, msg).catch(() => { }));
    });
}
