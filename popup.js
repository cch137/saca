document.getElementById("saca")?.addEventListener("click", async (ev) => {
  const [tab] = await chrome.tabs.query({ active: true });
  chrome.scripting.executeScript({
    func: () => {
      alert("Hi, I am cch137!");
    },
    target: { tabId: tab.id },
  });
});
