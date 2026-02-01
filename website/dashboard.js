const EXT_ID = "dajejhpohgnaaebkljmmkopeebhonebdgit ";

document.getElementById("load").onclick = () => {
  chrome.runtime.sendMessage(
    EXT_ID,
    { type: "GET_ATTENTION_DATA" },
    (res) => {
      document.getElementById("out").textContent =
        JSON.stringify(res.events, null, 2);
    }
  );
};

document.getElementById("clear").onclick = () => {
  chrome.runtime.sendMessage(
    EXT_ID,
    { type: "CLEAR_ATTENTION_DATA" },
    () => {
      document.getElementById("out").textContent = "Cleared";
    }
  );
};
