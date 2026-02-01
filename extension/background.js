chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_ATTENTION_DATA") {
    chrome.storage.local.get({ attentionEvents: [] }, (res) => {
      sendResponse({ events: res.attentionEvents });
    });
    return true;
  }

  if (msg.type === "CLEAR_ATTENTION_DATA") {
    chrome.storage.local.set({ attentionEvents: [] }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
