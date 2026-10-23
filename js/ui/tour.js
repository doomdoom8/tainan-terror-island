import { $ } from "./dom.js";

const CUE_SECONDS = 5;

export const mountTour = (city, store, world) => {
  const cues = city.tour ?? [];
  const caption = $("#tour-caption");
  const clock = $("#tour-time");
  const pauseBtn = $("#tour-pause");
  const total = cues.length * CUE_SECONDS;
  let elapsed = 0;
  let paused = false;
  let timer = null;
  let cueIndex = -1;
  let before = null;

  const pad = (n) => String(Math.floor(n)).padStart(2, "0");
  const showCue = (i) => {
    const cue = cues[i];
    cueIndex = i;
    caption.textContent = cue.caption;
    store.set({ time: cue.time, zoneId: null, eventId: null });
    if (cue.target === "all") {
      world.setSelected(null);
      world.home();
    } else {
      world.setSelected(cue.target);
      world.setActiveLabel(cue.target);
      world.focusZone(cue.target);
    }
  };
  const step = () => {
    if (paused) return;
    elapsed += 0.25;
    clock.textContent = `${pad(elapsed)} / ${pad(total)}`;
    const i = Math.min(cues.length - 1, Math.floor(elapsed / CUE_SECONDS));
    if (i !== cueIndex) showCue(i);
    if (elapsed >= total) exit();
  };
  const begin = () => {
    elapsed = 0;
    cueIndex = -1;
    paused = false;
    pauseBtn.textContent = "暫停";
    clearInterval(timer);
    timer = setInterval(step, 250);
    step();
  };
  const exit = () => {
    clearInterval(timer);
    timer = null;
    caption.textContent = "";
    world.setActiveLabel(null);
    world.setSelected(null);
    world.home();
    store.set({ touring: false, ...(before ?? {}) });
    $("#tour-start").focus();
  };

  $("#tour-start").addEventListener("click", () => {
    const state = store.get();
    if (cues.length === 0 || state.touring) return;
    before = { time: state.time, sideOpen: state.sideOpen };
    store.set({
      touring: true,
      overview: false,
      sideOpen: false,
      zoneId: null,
      eventId: null,
    });
    begin();
    pauseBtn.focus();
  });
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "繼續" : "暫停";
  });
  $("#tour-replay").addEventListener("click", begin);
  $("#tour-exit").addEventListener("click", exit);
  store.subscribe((state, prev, changed) => {
    if (changed.includes("touring"))
      document.body.classList.toggle("touring", state.touring);
  });
};
