(async () => {
  if (/ncueeclass.ncu.edu.tw/.test(location.origin)) {
    await import("./sites/ncueeclass");
    return;
  }
  if (/youtube.com/.test(location.origin)) {
    await import("./sites/youtube");
    return;
  }
})();
