import { $, $$, h, replaceKeepingFocus } from "./dom.js";
import { toggleIn } from "../state.js";
import { zoneVisible } from "../data/derive.js";

const ARROW_STEP = { ArrowRight: 1, ArrowLeft: -1 };

const selectTab = (tabs, tab) =>
  tabs.forEach((t) => {
    const on = t === tab;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    $(`#panel-${t.dataset.panel}`).classList.toggle("active", on);
  });

const mountTabs = () => {
  const tabs = $$(".control-tabs [data-panel]");
  tabs.forEach((tab, i) => {
    tab.setAttribute("aria-controls", `panel-${tab.dataset.panel}`);
    tab.tabIndex = tab.classList.contains("active") ? 0 : -1;
    tab.addEventListener("click", () => selectTab(tabs, tab));
    tab.addEventListener("keydown", (e) => {
      const step = ARROW_STEP[e.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      selectTab(tabs, next);
      next.focus();
    });
  });
};

const termButton = (key, pressed, onclick, ...children) =>
  h("button", { class: "term", "data-key": key, "aria-pressed": String(pressed), onclick }, ...children);

const isleButtons = (city, state, store) => [
  termButton("isle:all", !state.isle, () => store.set({ isle: null }), "全部"),
  city.zones.map((z) =>
    termButton(`isle:${z.id}`, state.isle === z.id, () => store.set({ isle: state.isle === z.id ? null : z.id }), `${String(z.number).padStart(2, "0")} ${z.name}`),
  ),
];

const fearButtons = (fears, state, store) => [
  fears.map((f) => {
    const btn = termButton(`fear:${f.id}`, state.fears.includes(f.id), () => store.set({ fears: toggleIn(store.get().fears, f.id) }), h("i"), f.name);
    btn.classList.add("fear");
    btn.style.setProperty("--c", f.color);
    return btn;
  }),
  state.fears.length ? h("button", { class: "term clear", "data-key": "fear:clear", onclick: () => store.set({ fears: [] }) }, "清除") : null,
];

export const mountFilters = (city, store) => {
  const isleBox = $("#isle-buttons");
  const fearBox = $("#fear-buttons");
  const usedFears = city.fear.filter((f) => city.zones.some((z) => z.fear.includes(f.id)));
  mountTabs();

  const render = (state) => {
    replaceKeepingFocus(isleBox, isleButtons(city, state, store));
    replaceKeepingFocus(fearBox, fearButtons(usedFears, state, store));
    const visible = city.zones.filter((z) => zoneVisible(z, state));
    $("#status").textContent = visible.length === city.zones.length ? "" : `顯示 ${visible.length} / ${city.zones.length} 座島`;
  };
  store.subscribe((state, prev, changed) => {
    if (changed.includes("isle") || changed.includes("fears")) render(state);
  });
  render(store.get());

  return { visibleIds: (state) => new Set(city.zones.filter((z) => zoneVisible(z, state)).map((z) => z.id)) };
};
