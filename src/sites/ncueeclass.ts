import { downloadFile as dl, query as q, queryAll as qA } from "../utils";
import type { Children, XElementCallback } from "../builder";
import builder from "../builder";

export default (() => {
  const downloadFile = dl;
  const query = q;
  const queryAll = qA;

  const Button = (content: string) =>
    builder("button", { class: "saca-button" }, content);

  const Container = (children?: Children, cb?: XElementCallback) =>
    builder("div", {}, children, cb);

  function getMediaDocTitle() {
    return String(
      ((query(".title") as HTMLElement).innerText || "unknown")
        .trim()
        .replace(/(\/|\\|\?|\#)/, "_")
    );
  }

  const courseIdRegex = /\/course\/([0-9]+)$/;
  const pathnameMatches =
    courseIdRegex.exec(location.pathname) ||
    courseIdRegex.exec(query("ol.breadcrumb li a")?.getAttribute("href")!);
  const courseId = pathnameMatches ? pathnameMatches[1] : null;
  if (!courseId) return;

  console.log("course id:", courseId);

  (async () => {
    // inject breadcrumb
    const breadcrumb = query("ol.breadcrumb");
    if (!breadcrumb) return;
    breadcrumb.parentNode!.insertBefore(
      Container(
        Container("Saca is live!", (el) => (el.style.color = "#888")),
        (el) => {
          el.style.margin = "-20px 0px 20px 0px";
          el.style.padding = "0px 15px";
        }
      ),
      breadcrumb.nextSibling
    );
  })();

  (async () => {
    // Download all attachments
    const filelistEl = query(".fs-filelist");
    if (!filelistEl) return;
    filelistEl.appendChild(
      Container(
        Button("Download all").on("click", () => {
          queryAll("a", filelistEl).forEach((a) => a.click());
        })
      )
    );
  })();

  (async () => {
    // Download audio
    const audioContainer = query("#audioPlaceHolder");
    if (!audioContainer) return;
    audioContainer.parentNode!.insertBefore(
      Container(
        Button("Download audio").on("click", () => {
          queryAll("source", audioContainer).forEach((a) =>
            downloadFile(a.src, getMediaDocTitle())
          );
        })
      ),
      audioContainer.nextSibling
    );
  })();

  (async () => {
    // Download video
    const videoContainer = query("#videoFrame");
    const ctrlFrame = query("#fs-content")!;
    if (!videoContainer || !ctrlFrame) return;
    ctrlFrame.parentNode!.insertBefore(
      Container(
        Button("Download video").on("click", () => {
          queryAll("video", videoContainer).forEach((a) =>
            downloadFile(a.src, getMediaDocTitle())
          );
        }),
        (el) => (el.style.padding = "0px 0px 16px")
      ),
      ctrlFrame
    );
  })();

  (async () => {
    // Convert PPT to PDF
    const pptContainer = query("#pptContainer");
    if (!pptContainer) return;
    const apiOrigin = "https://api.cch137.link";
    const buttonText = "Convert to PDF";
    const buttonLoadingText = "Converting to PDF...";
    pptContainer.parentNode!.appendChild(
      Container(
        Button(buttonText).on("click", async (ev) => {
          const button = ev.target as HTMLButtonElement;
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
            const sources = [...queryAll("img", pptContainer)].map(
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
        })
      )
    );
  })();
})();
