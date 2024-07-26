(async () => {
  if (location.origin !== "https://ncueeclass.ncu.edu.tw") return;

  /**
   * Download file
   * @param {string} href
   * @param {string} filename
   */
  function downloadFile(href, filename) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /**
   * Create button
   * @param {string} content
   */
  function createButton(content) {
    const button = document.createElement("button");
    button.innerText = content;
    button.classList.add("saca-button");
    return button;
  }

  function getMediaDocTitle() {
    return String(
      (document.querySelector(".title").innerText || "unknown")
        .trim()
        .replace(/(\/|\\|\?|\#)/, "_")
    );
  }

  const courseIdRegex = /\/course\/([0-9]+)$/;
  const pathnameMatches =
    courseIdRegex.exec(location.pathname) ||
    courseIdRegex.exec(
      document.querySelector("ol.breadcrumb li a")?.getAttribute("href")
    );
  const courseId = pathnameMatches ? pathnameMatches[1] : null;
  if (!courseId) return;

  console.log("course id:", courseId);

  (async () => {
    // inject breadcrumb
    const breadcrumb = document.querySelector("ol.breadcrumb");
    if (!breadcrumb) return;
    const container = document.createElement("div");
    container.style.margin = "-20px 0px 20px 0px";
    container.style.padding = "0px 15px";
    const div = document.createElement("div");
    div.style.color = "#888";
    div.innerText = "Saca is live!";
    container.appendChild(div);
    breadcrumb.parentNode.insertBefore(container, breadcrumb.nextSibling);
  })();

  (async () => {
    // Download all attachments
    const filelistEl = document.querySelector(".fs-filelist");
    if (!filelistEl) return;
    const container = document.createElement("div");
    const button = createButton("Download all");
    button.addEventListener("click", () => {
      filelistEl.querySelectorAll("a").forEach((a) => a.click());
    });
    container.appendChild(button);
    filelistEl.appendChild(container);
  })();

  (async () => {
    // Download audio
    const audioContainer = document.querySelector("#audioPlaceHolder");
    if (!audioContainer) return;
    const container = document.createElement("div");
    const button = createButton("Download audio");
    button.addEventListener("click", () => {
      audioContainer
        .querySelectorAll("source")
        .forEach((a) => downloadFile(a.src, getMediaDocTitle()));
    });
    container.appendChild(button);
    audioContainer.parentNode.insertBefore(
      container,
      audioContainer.nextSibling
    );
  })();

  (async () => {
    // Download video
    const videoContainer = document.querySelector("#videoFrame");
    if (!videoContainer) return;
    const container = document.createElement("div");
    container.style.padding = "0px 0px 16px";
    const button = createButton("Download video");
    button.addEventListener("click", () => {
      videoContainer
        .querySelectorAll("video")
        .forEach((a) => downloadFile(a.src, getMediaDocTitle()));
    });
    container.appendChild(button);
    const ctrlFrame = document.querySelector("#fs-content");
    ctrlFrame.parentNode.insertBefore(container, ctrlFrame);
  })();

  (async () => {
    // Convert PPT to PDF
    const pptContainer = document.querySelector("#pptContainer");
    if (!pptContainer) return;
    const apiOrigin = "https://api.cch137.link";
    const container = document.createElement("div");
    const buttonText = "Convert to PDF";
    const buttonLoadingText = "Converting to PDF...";
    const button = createButton(buttonText);
    button.innerText = buttonText;
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.innerText = buttonLoadingText;
      try {
        const taskId = await (async () => {
          const converted = button.getAttribute("data-task-id");
          if (converted) return converted;
          const createTaskRes = await fetch(
            `${apiOrigin}/images-to-pdf/create-task`,
            { method: "POST" }
          );
          return (await createTaskRes.json()).id;
        })();
        if (typeof taskId !== "string") return new Error("Invalid task id");
        button.setAttribute("data-task-id", taskId);
        const sources = [...pptContainer.querySelectorAll("img")].map(
          ({ src }) => src
        );
        await Promise.all(
          sources.map(async (src, i) => {
            const res = await fetch(src);
            const data = new Uint8Array(await res.arrayBuffer());
            await fetch(
              `${apiOrigin}/images-to-pdf/upload/${encodeURIComponent(
                taskId
              )}/${i}`,
              {
                method: "POST",
                body: data,
                headers: { "Content-Type": "application/uint8array" },
              }
            );
          })
        );
        const filename = getMediaDocTitle();
        const downloadLink = `${apiOrigin}/images-to-pdf/convert/${encodeURIComponent(
          taskId
        )}/${encodeURIComponent(filename)}.pdf`;
        downloadFile(downloadLink, filename);
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      } finally {
        button.disabled = false;
        button.innerText = buttonText;
      }
    });
    container.appendChild(button);
    pptContainer.parentNode.appendChild(container);
  })();
})();
