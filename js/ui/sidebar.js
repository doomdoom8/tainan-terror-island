import { $, h, replaceKeepingFocus } from "./dom.js";
import { searchZones, formatDate } from "../data/derive.js";

const eventRow = (event, store) =>
  h(
    "li",
    {},
    h(
      "button",
      {
        class: "ev-row",
        "data-key": `e:${event.id}`,
        "aria-current": store.get().eventId === event.id ? "true" : null,
        onclick: () => store.set({ zoneId: event.zoneId, eventId: event.id }),
      },
      h("time", { datetime: event.date }, formatDate(event.date)),
      h("span", {}, event.name),
    ),
  );

const zoneRow = (zone, store, expanded) =>
  h(
    "li",
    { class: `zone-row${expanded ? " open" : ""}`, "data-zone": zone.id },
    h(
      "button",
      {
        class: "zone-btn",
        "data-key": `z:${zone.id}`,
        "aria-expanded": String(expanded),
        onclick: () => store.set({ zoneId: expanded && !store.get().eventId ? null : zone.id, eventId: null }),
      },
      h("b", {}, String(zone.number).padStart(2, "0")),
      h("span", { class: "zone-name" }, zone.name, h("small", {}, zone.place)),
      h("em", {}, zone.events.length ? `${zone.events.length} 則` : "整理中"),
    ),
    expanded && zone.events.length ? h("ol", { class: "ev-list" }, zone.events.map((e) => eventRow(e, store))) : null,
  );

export const mountSidebar = (city, store) => {
  const tree = $("#tree");
  const search = $("#search");
  const total = city.zones.reduce((n, z) => n + z.events.length, 0);
  $("#side-count").textContent = `${city.zones.length} 座島・${total} 則真實新聞・${city.meta.period.label}`;
  $("#disclaimer").textContent = `${city.meta.period.note}${city.meta.disclaimer}`;
  search.addEventListener("input", () => store.set({ query: search.value.trim() }));

  const render = (state) => {
    const zones = searchZones(city.zones, state.query);
    const expandAll = Boolean(state.query);
    const rows = zones.map((z) => zoneRow(z, store, expandAll || z.id === state.zoneId));
    replaceKeepingFocus(tree, rows.length ? h("ol", { class: "zones" }, rows) : h("p", { class: "empty" }, "找不到符合的島嶼或事件。"));
    tree.querySelector(".zone-row.open")?.scrollIntoView({ block: "nearest" });
  };
  const applySide = (open) => {
    document.body.classList.toggle("side-open", open);
    $("#sidebar-toggle").setAttribute("aria-expanded", String(open));
  };
  store.subscribe((state, prev, changed) => {
    if (changed.some((k) => ["query", "zoneId", "eventId"].includes(k))) render(state);
    if (changed.includes("sideOpen")) applySide(state.sideOpen);
  });
  render(store.get());
  applySide(store.get().sideOpen);
};
