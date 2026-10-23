import { $, $$ } from "./dom.js";

export const mountHud = (store) => {
  $$("[data-time]").forEach((btn) =>
    btn.addEventListener("click", () =>
      store.set({ time: Number(btn.dataset.time) }),
    ),
  );
  $$("[data-toggle]").forEach((btn) => {
    const key = btn.dataset.toggle;
    btn.addEventListener("click", () =>
      store.set({ [key]: !store.get()[key] }),
    );
  });
  const toggleSide = () => store.set({ sideOpen: !store.get().sideOpen });
  $("#sidebar-toggle").addEventListener("click", toggleSide);
  $("#sheet-handle").addEventListener("click", toggleSide);
  $$("[data-action='home']").forEach((btn) =>
    btn.addEventListener("click", () =>
      store.set({
        zoneId: null,
        eventId: null,
        isle: null,
        fears: [],
        monthIndex: null,
        homeTick: Date.now(),
        ...(btn.closest("#sidebar") ? { sideOpen: false } : {}),
      }),
    ),
  );

  const controls = $(".controls");
  new ResizeObserver(() =>
    document.body.style.setProperty(
      "--controls-h",
      `${controls.offsetHeight}px`,
    ),
  ).observe(controls);

  const render = (state) => {
    $$("[data-toggle]").forEach((btn) =>
      btn.setAttribute(
        "aria-pressed",
        String(Boolean(state[btn.dataset.toggle])),
      ),
    );
    $$("[data-time]").forEach((btn) => {
      const on = Number(btn.dataset.time) === state.time;
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  };
  store.subscribe(render);
  render(store.get());
};
