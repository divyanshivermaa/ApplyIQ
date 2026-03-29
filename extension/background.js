// simple Hindi: kabhi-kabhi content script tab me inject nahi hota
// tab popup se message bhejo aur fail ho jaye to background inject karke retry karega

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "INJECT_CONTENT_SCRIPT") {
    const tabId = msg.tabId;

    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ["content.js"]
      },
      () => {
        // simple Hindi: inject ke baad response bhej do
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true });
        }
      }
    );

    return true; // async response
  }
});
