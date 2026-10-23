import { $, h, replace, extLink, fearChip } from "./dom.js";
import { formatDate } from "../data/derive.js";

const HELPLINE_KEYS = ["helpline", "helplineKids", "helplineDrug"];

const helplines = (meta, zone, event) =>
  HELPLINE_KEYS.filter((key) => zone[key] || event?.[key]).map((key) =>
    h("p", { class: "helpline" }, meta[key]),
  );

const fearChips = (ids, fearById) =>
  h(
    "div",
    { class: "fear-chips" },
    ids
      .map((id) => fearById.get(id))
      .filter(Boolean)
      .map(fearChip),
  );

const zoneView = (city, zone, store, fearById) =>
  h(
    "div",
    { class: "card-zone" },
    h(
      "div",
      { class: "eyebrow" },
      `ISLAND ${String(zone.number).padStart(2, "0")} · ${zone.place}`,
    ),
    h("h2", {}, zone.name),
    h(
      "p",
      { class: "card-tag" },
      zone.tag,
      h("span", {}, `${zone.events.length} 則事件`),
    ),
    h("p", { class: "card-summary" }, zone.summary),
    fearChips(zone.fear, fearById),
    zone.events.length
      ? h(
          "ol",
          { class: "card-events" },
          zone.events.map((e) =>
            h(
              "li",
              {},
              h(
                "button",
                { onclick: () => store.set({ eventId: e.id }) },
                h("time", {}, formatDate(e.date)),
                h("span", {}, e.name),
                h("i", { "aria-hidden": "true" }, "→"),
              ),
            ),
          ),
        )
      : h("p", { class: "empty" }, "本島資料整理中。"),
    h(
      "p",
      { class: "card-note" },
      "以下事件都有新聞報導可查，文字只摘要報導內容，不加入未經證實的推論。島上的 3D 場景是示意插畫。",
    ),
    helplines(city.meta, zone, null),
  );

const eventView = (city, zone, event, store, fearById) =>
  h(
    "div",
    { class: "card-event" },
    h(
      "button",
      { class: "back", onclick: () => store.set({ eventId: null }) },
      `← ${zone.name}`,
    ),
    h(
      "div",
      { class: "eyebrow" },
      `${formatDate(event.date)} · ${event.place}`,
    ),
    h("h2", {}, event.name),
    fearChips(event.fear, fearById),
    h("p", { class: "card-plain" }, event.plain),
    event.facts?.length
      ? h(
          "ul",
          { class: "facts" },
          event.facts.map((f) => h("li", {}, f)),
        )
      : null,
    h("h3", {}, "原始報導"),
    h(
      "ol",
      { class: "sources" },
      event.sources.map((s) =>
        h(
          "li",
          {},
          extLink(
            s.url,
            h("b", {}, s.outlet),
            h("span", {}, s.title),
            h("i", { "aria-hidden": "true" }, "↗"),
          ),
        ),
      ),
    ),
    helplines(city.meta, zone, event),
  );

const returnFocus = (zoneId) => {
  const inList = $(`.zone-btn[data-key="z:${zoneId}"]`);
  const target = inList?.checkVisibility({ visibilityProperty: true })
    ? inList
    : $(`.chip[data-zone="${zoneId}"]`);
  (target ?? $("#sidebar-toggle")).focus();
};

export const mountCard = (city, store) => {
  const card = $("#card");
  const content = $("#card-content");
  const fearById = new Map(city.fear.map((f) => [f.id, f]));
  $("#card-close").addEventListener("click", () =>
    store.set({ zoneId: null, eventId: null }),
  );

  store.subscribe((state, prev, changed) => {
    if (!changed.some((k) => k === "zoneId" || k === "eventId")) return;
    const zone = city.zones.find((z) => z.id === state.zoneId);
    const focusWasInCard = card.contains(document.activeElement);
    card.hidden = !zone;
    document.body.classList.toggle("has-sel", Boolean(zone));
    if (!zone) {
      if (focusWasInCard) returnFocus(prev.zoneId);
      return;
    }
    const event = zone.events.find((e) => e.id === state.eventId);
    const hadFocus = content.contains(document.activeElement);
    replace(
      content,
      event
        ? eventView(city, zone, event, store, fearById)
        : zoneView(city, zone, store, fearById),
    );
    card.scrollTop = 0;
    const heading = content.querySelector("h2");
    heading.tabIndex = -1;
    if (hadFocus) heading.focus();
  });
};
