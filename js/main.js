import { loadCity } from "./data/load.js";
import { createStore, INITIAL_STATE } from "./state.js";
import { createWorld } from "./world/scene.js";
import { $ } from "./ui/dom.js";
import { mountSidebar } from "./ui/sidebar.js";
import { mountCard } from "./ui/card.js";
import { mountTimeline } from "./ui/timeline.js";
import { mountFilters } from "./ui/filters.js";
import { mountOverview } from "./ui/overview.js";
import { mountTour } from "./ui/tour.js";
import { mountDialogs } from "./ui/dialogs.js";
import { mountHud } from "./ui/hud.js";

const MOBILE_QUERY = "(max-width: 760px)";

const fillStatic = (city) => {
  const total = city.zones.reduce((n, z) => n + z.events.length, 0);
  $("#hero-number").textContent = String(city.zones.length);
  $("#hero-period").textContent =
    `${city.meta.period.label}・${total} 則真實新聞。點開一座島，看看這座城發生過什麼。`;
  $("#mascot-text").textContent = city.meta.mascot;
};

const connectWorld = (store, world, timeline, filters) => {
  const sync = (state, prev, changed) => {
    if (changed.includes("time")) world.setTime(state.time);
    if (changed.includes("zoneId")) {
      world.setSelected(state.zoneId);
      world.setActiveLabel(state.zoneId);
      if (state.zoneId) world.focusZone(state.zoneId);
      else if (!state.touring) world.home();
    }
    if (changed.includes("homeTick")) world.home();
    if (changed.some((k) => k === "isle" || k === "fears"))
      world.setVisible(filters.visibleIds(state));
    if (changed.some((k) => k === "monthIndex" || k === "cumulative"))
      world.setAwake(timeline.awakeIds(state));
    if (changed.includes("frozen")) world.setFrozen(state.frozen);
    if (changed.includes("bird")) {
      world.setBird(state.bird);
      if (!state.zoneId) world.home();
    }
    if (changed.includes("names")) world.setNames(state.names);
  };
  store.subscribe(sync);
  const s = store.get();
  world.setTime(s.time);
  world.setVisible(filters.visibleIds(s));
};

const boot = async () => {
  const app = $("#app");
  const city = await loadCity(app.dataset.src);
  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  const store = createStore({ ...INITIAL_STATE, sideOpen: !mobile });
  document.body.classList.toggle("side-open", !mobile);
  fillStatic(city);
  const world = createWorld($("#stage"), city, {
    onPick: (zoneId) => {
      if (store.get().touring) return;
      store.set({ zoneId, eventId: null });
    },
  });
  if (mobile) {
    store.subscribe((state, prev, changed) => {
      if (changed.includes("zoneId") && state.zoneId)
        store.set({ sideOpen: false });
    });
  }
  mountSidebar(city, store);
  mountCard(city, store);
  const timeline = mountTimeline(city, store);
  const filters = mountFilters(city, store);
  mountOverview(city, store);
  mountHud(store);
  mountTour(city, store, world);
  connectWorld(store, world, timeline, filters);
  mountDialogs(city);
  document.addEventListener("keydown", (e) => {
    const dialogOpen = Boolean($(".dialog:not([hidden])"));
    if (e.key === "Escape" && !dialogOpen && store.get().zoneId)
      store.set({ zoneId: null, eventId: null });
  });
  $("#loading").classList.add("done");
};

boot().catch((err) => {
  console.error("[terror-island] 載入失敗", err);
  $("#loading-text").textContent =
    `載入失敗：${err.message}。請重新整理頁面再試一次。`;
});
