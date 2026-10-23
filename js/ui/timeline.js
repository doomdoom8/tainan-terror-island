import { $, h, replace } from "./dom.js";
import {
  allEvents,
  monthsOf,
  eventsInMonth,
  monthKey,
  formatMonth,
  formatDate,
} from "../data/derive.js";

const PLAY_STEP_MS = 900;
const MIN_TICK_GAP_PCT = 6;
const MIN_TICK_GAP_PX = 44;

export const mountTimeline = (city, store) => {
  const events = allEvents(city.zones);
  const months = monthsOf(events);
  const slider = $("#tl");
  const output = $("#tl-month");
  const list = $("#tl-list");
  const play = $("#tl-play");
  const allBtn = $("#tl-all");
  const cumBtn = $("#tl-cum");
  const zoneName = new Map(city.zones.map((z) => [z.id, z.name]));
  slider.max = String(Math.max(0, months.length - 1));
  slider.value = slider.max;

  const counts = months.map(
    (m) => events.filter((e) => monthKey(e.date) === m).length,
  );
  const peak = Math.max(1, ...counts);
  replace(
    $("#tl-dots"),
    counts.map((c, i) =>
      h("i", {
        style: {
          left: `${(i / Math.max(1, months.length - 1)) * 100}%`,
          height: `${4 + (c / peak) * 14}px`,
        },
      }),
    ),
  );
  const trackWidth = slider.clientWidth;
  const tickGap =
    trackWidth > 0
      ? Math.max(MIN_TICK_GAP_PCT, (MIN_TICK_GAP_PX / trackWidth) * 100)
      : MIN_TICK_GAP_PCT;
  const yearTicks = [...new Set(months.map((m) => m.slice(0, 4)))]
    .map((y) => ({
      y,
      pct:
        (months.findIndex((m) => m.startsWith(y)) /
          Math.max(1, months.length - 1)) *
        100,
    }))
    .reduce(
      (kept, tick) =>
        kept.length && tick.pct - kept[kept.length - 1].pct < tickGap
          ? kept
          : [...kept, tick],
      [],
    );
  replace(
    $("#tl-ticks"),
    yearTicks.map(({ y, pct }) => h("span", { style: { left: `${pct}%` } }, y)),
  );

  let timer = null;
  const stop = () => {
    clearInterval(timer);
    timer = null;
    play.textContent = "▶";
    play.setAttribute("aria-label", "播放時間軸");
  };
  const startPlay = () => {
    const from = store.get().monthIndex;
    store.set({
      monthIndex: from === null || from >= months.length - 1 ? 0 : from,
    });
    play.textContent = "❚❚";
    play.setAttribute("aria-label", "暫停時間軸");
    timer = setInterval(() => {
      const i = store.get().monthIndex;
      if (i === null || i >= months.length - 1) stop();
      else store.set({ monthIndex: i + 1 });
    }, PLAY_STEP_MS);
  };
  store.subscribe((state, prev, changed) => {
    const cleared = changed.includes("monthIndex") && state.monthIndex === null;
    const touring = changed.includes("touring") && state.touring;
    if (timer && (cleared || touring)) stop();
  });

  slider.addEventListener("input", () =>
    store.set({ monthIndex: Number(slider.value) }),
  );
  play.addEventListener("click", () => (timer ? stop() : startPlay()));
  allBtn.addEventListener("click", () => {
    stop();
    store.set({ monthIndex: null });
  });
  cumBtn.addEventListener("click", () =>
    store.set({ cumulative: !store.get().cumulative }),
  );

  const render = (state) => {
    const active = state.monthIndex !== null;
    allBtn.setAttribute("aria-pressed", String(!active));
    cumBtn.setAttribute("aria-pressed", String(state.cumulative));
    if (!active) {
      output.textContent = `全部 ${events.length} 則`;
      replace(
        list,
        h(
          "p",
          { class: "control-note" },
          `拖動時間軸，看 ${formatMonth(months[0] ?? "2011-01")} 以來每個月發生了什麼。`,
        ),
      );
      return;
    }
    const month = months[state.monthIndex];
    slider.value = String(state.monthIndex);
    const shown = eventsInMonth(events, month, state.cumulative);
    output.textContent = `${state.cumulative ? "至 " : ""}${formatMonth(month)}・${shown.length} 則`;
    replace(
      list,
      shown.slice(0, 30).map((e) =>
        h(
          "button",
          {
            class: "tl-ev",
            onclick: () => store.set({ zoneId: e.zoneId, eventId: e.id }),
          },
          h("time", {}, formatDate(e.date)),
          h("b", {}, zoneName.get(e.zoneId)),
          h("span", {}, e.name),
        ),
      ),
    );
  };
  store.subscribe((state, prev, changed) => {
    if (changed.includes("monthIndex") || changed.includes("cumulative"))
      render(state);
  });
  render(store.get());

  return {
    awakeIds: (state) => {
      if (state.monthIndex === null) return new Set();
      return new Set(
        eventsInMonth(events, months[state.monthIndex], state.cumulative).map(
          (e) => e.zoneId,
        ),
      );
    },
  };
};
