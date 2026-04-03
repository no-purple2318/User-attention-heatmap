let eventBuffer = [];
let sessionId = null;
let currentUrl = 'unknown';

// Initialize or reuse session ID per recording session
async function getOrCreateSessionId() {
    const data = await chrome.storage.local.get(["sessionId", "user"]);
    if (!data.user) return null;
    if (data.sessionId) return data.sessionId;

    const newSessionId = crypto.randomUUID();
    await chrome.storage.local.set({ sessionId: newSessionId });
    sessionId = newSessionId;
    return newSessionId;
}

// Single message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TRACK_EVENT") {
        // Capture current URL from the content script payload
        if (message.payload.url) currentUrl = message.payload.url;
        eventBuffer.push(message.payload);
    }

    if (message.type === "START_TRACKING") {
        // Clear old session so a fresh one is created for new recording
        chrome.storage.local.remove("sessionId");
        sessionId = null;
        eventBuffer = [];
    }

    if (message.type === "STOP_TRACKING" || message.type === "LOGOUT") {
        closeSession();
    }

    return true;
});

// Flush to backend every 5s
setInterval(async () => {
    if (eventBuffer.length === 0) return;

    const data = await chrome.storage.local.get(["user", "token"]);
    if (!data.user || !data.token) {
        eventBuffer = [];
        return;
    }

    const sid = await getOrCreateSessionId();
    if (!sid) return;

    const currentBatch = [...eventBuffer];
    eventBuffer = [];

    // Normalise coordinates to 0..1 range before sending
    const normalisedBatch = currentBatch.map(ev => ({
        ...ev,
        x: typeof ev.x === 'number' ? ev.x / (window?.innerWidth || 1920) : ev.x,
        y: typeof ev.y === 'number' ? ev.y / (window?.innerHeight || 1080) : ev.y,
    }));

    try {
        const res = await fetch("http://localhost:3001/track/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${data.token}`
            },
            body: JSON.stringify({
                sessionId: sid,
                url: currentUrl,
                events: normalisedBatch
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error("Flush rejected:", err);
            eventBuffer = [...currentBatch, ...eventBuffer]; // retry
        } else {
            console.log(`Flushed ${currentBatch.length} events OK.`);
        }
    } catch (error) {
        console.error("Flush network error:", error);
        eventBuffer = [...currentBatch, ...eventBuffer];
    }
}, 5000);

async function closeSession() {
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
        } catch (e) {
            console.error("Failed to close session:", e);
        }
        await chrome.storage.local.remove("sessionId");
        sessionId = null;
    }
}
