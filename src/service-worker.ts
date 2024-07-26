chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { tabId } = activeInfo;
  const tab = await chrome.tabs.get(tabId);
  chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      alert("active!");
    },
  });
});

export {};
