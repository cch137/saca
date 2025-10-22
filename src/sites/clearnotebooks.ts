import builder from "../builder";
import { downloadFile, fetchProxy } from "../utils";

export default (() => {
  const BUTTON_TEXT = "Convert to PDF";
  const BUTTON_LOADING_TEXT = "Converting to PDF...";

  function sanitizeFilename(input: string) {
    try {
      return String((input || "unknown").trim().replace(/(\/|\\|\?|\#)/g, "_"));
    } catch {
      return "unknown";
    }
  }

  (async () => {
    const pagesBg = document.querySelector(".pages__bg") as HTMLElement | null;
    if (!pagesBg) return;

    // Avoid duplicate insertion if re-run
    if (pagesBg.querySelector(".saca-button")) return;

    const btn = builder("button", { class: "saca-button" }, BUTTON_TEXT).on(
      "click",
      async (ev) => {
        const button = ev.target as HTMLButtonElement;
        button.disabled = true;
        const prevText = button.innerText;
        button.innerText = BUTTON_LOADING_TEXT;

        try {
          const pages = Array.from(
            document.querySelectorAll<HTMLElement>(".pages__page")
          );
          if (!pages.length) throw new Error("No pages found");

          const title = sanitizeFilename(document.title);

          const waitForElement = async <T extends Element>(
            selector: string,
            timeout = 15000
          ): Promise<T> => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
              const el = document.querySelector(selector) as T | null;
              if (el) return el;
              await new Promise((r) => setTimeout(r, 100));
            }
            throw new Error(`Element not found: ${selector}`);
          };

          const waitForImageLoad = async (
            img: HTMLImageElement,
            timeout = 15000
          ) => {
            if (img.complete && img.naturalWidth > 0) return;
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(() => {
                cleanup();
                reject(new Error("Image load timeout"));
              }, timeout);
              const onLoad = () => {
                cleanup();
                resolve();
              };
              const onError = () => {
                cleanup();
                reject(new Error("Image failed to load"));
              };
              const cleanup = () => {
                clearTimeout(timer);
                img.removeEventListener("load", onLoad);
                img.removeEventListener("error", onError);
              };
              img.addEventListener("load", onLoad, { once: true });
              img.addEventListener("error", onError, { once: true });
            });
          };

          // Step 1: collect all image sources by iterating pages
          const sources: string[] = [];
          for (let i = 0; i < pages.length; i++) {
            pages[i].click();
            const img = await waitForElement<HTMLImageElement>(
              ".main-canvas>img",
              20000
            );
            await waitForImageLoad(img, 20000);
            if (img.src) sources.push(img.src);
          }

          // Step 2: close viewer after retrieving all images
          (
            document.querySelector(
              ".button-controls>:nth-child(2)"
            ) as HTMLElement | null
          )?.click();

          // Step 3: upload images and trigger PDF conversion through API
          const apiOrigin = "https://api.cch137.com";

          const taskId = await (async () => {
            const converted = button.getAttribute("data-task-id");
            if (converted) return converted;
            const createTaskRes = await fetch(
              `${apiOrigin}/images-to-pdf/create-task`,
              { method: "POST" }
            );
            const data = await createTaskRes.json();
            return data.id as string;
          })();
          if (typeof taskId !== "string") throw new Error("Invalid task id");
          button.setAttribute("data-task-id", taskId);

          await Promise.all(
            sources.map(async (src, i) => {
              const res = await fetchProxy(src);
              const buf = await res.arrayBuffer();
              const data = new Uint8Array(buf);
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

          const downloadLink = `${apiOrigin}/images-to-pdf/convert/${encodeURIComponent(
            taskId
          )}/${encodeURIComponent(title)}.pdf`;
          downloadFile(downloadLink, title);
        } catch (e) {
          alert(e instanceof Error ? e.message : String(e));
        } finally {
          button.disabled = false;
          button.innerText = prevText || BUTTON_TEXT;
        }
      }
    );

    // Insert the button as the first child of .pages__bg
    pagesBg.insertBefore(btn, pagesBg.firstChild);
  })();
})();
