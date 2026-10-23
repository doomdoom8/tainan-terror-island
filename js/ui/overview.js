import { $, h, replace } from "./dom.js";
import { allEvents, countByYear, countByFear } from "../data/derive.js";

const bar = (label, count, max, color, onclick) =>
  h(
    "li",
    {},
    h(
      onclick ? "button" : "div",
      { class: "bar", onclick },
      h("span", { class: "bar-label" }, label),
      h("span", { class: "bar-track" }, h("i", { style: { width: `${(count / max) * 100}%`, background: color } })),
      h("b", {}, String(count)),
    ),
  );

export const mountOverview = (city, store) => {
  const panel = $("#overview");
  const events = allEvents(city.zones);
  const zones = [...city.zones].sort((a, b) => b.events.length - a.events.length);
  const zoneMax = Math.max(1, ...zones.map((z) => z.events.length));
  const years = Object.entries(countByYear(events)).sort(([a], [b]) => a.localeCompare(b));
  const yearMax = Math.max(1, ...years.map(([, c]) => c));
  const fears = countByFear(events, city.fear);
  const fearMax = Math.max(1, ...fears.map((f) => f.count));
  const totalSources = events.reduce((n, e) => n + e.sources.length, 0);

  $("#ov-sub").textContent = `${events.length} 則事件・${totalSources} 則原始報導`;
  replace(
    $("#overview-body"),
    h("p", { class: "ov-note" }, city.meta.period.note),
    h("h4", {}, "各島事件數"),
    h("ol", { class: "bars" }, zones.map((z) => bar(`${String(z.number).padStart(2, "0")} ${z.name}`, z.events.length, zoneMax, "var(--accent)", () => store.set({ zoneId: z.id, eventId: null, overview: false })))),
    h("h4", {}, "事件類型"),
    h("ol", { class: "bars" }, fears.map((f) => bar(f.name, f.count, fearMax, f.color))),
    h("h4", {}, "逐年事件數"),
    h("ol", { class: "bars" }, years.map(([y, c]) => bar(y, c, yearMax, "var(--ink)"))),
    h("p", { class: "ov-note" }, "這還不是全部——收錄的是有原始報導可查證的事件。"),
  );
  $("#overview-close").addEventListener("click", () => store.set({ overview: false }));
  store.subscribe((state, prev, changed) => {
    if (!changed.includes("overview")) return;
    panel.hidden = !state.overview;
    document.body.classList.toggle("ov-open", state.overview);
  });
};
