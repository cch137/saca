chrome.action.onClicked.addListener(async (tab) => {
  const { id } = tab;
  chrome.scripting.executeScript({
    target: { tabId: id! },
    func: async () => {
      console.log("active!");
    },
  });
});
