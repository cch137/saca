import { queryAll } from "../utils";

document.addEventListener("keyup", (e) => {
  if (!e.altKey) return;
  const speed = Number(e.key);
  if (isNaN(speed)) return;
  queryAll("video").forEach((v) => {
    if (v.playbackRate) v.playbackRate = speed / 2;
  });
});
