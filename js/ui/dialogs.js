import { $, $$, h, replace } from "./dom.js";
import { createModal } from "./modal.js";

const SEEN_KEY = "tainan-island-intro-seen";

const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

const writeSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    return;
  }
};

const mountIntro = (city) => {
  const box = $("#intro");
  const steps = city.intro ?? [];
  let i = 0;
  const show = () => {
    const step = steps[i];
    $("#intro-count").textContent =
      `${city.meta.welcome} / ${String(i + 1).padStart(2, "0")}`;
    $("#intro-title").textContent = step.title;
    $("#intro-body").textContent = step.body;
    $("#intro-next").textContent =
      i === steps.length - 1 ? "開始探索" : "下一步 →";
  };
  const modal = createModal(box, { onClose: writeSeen });
  const close = modal.close;
  const open = () => {
    if (steps.length === 0) return;
    i = 0;
    show();
    modal.open($("#intro-next"));
  };
  $("#intro-next").addEventListener("click", () => {
    if (i >= steps.length - 1) close();
    else {
      i += 1;
      show();
    }
  });
  $("#intro-skip").addEventListener("click", close);
  $("#help").addEventListener("click", open);
  if (!readSeen()) open();
};

const mountAbout = (city) => {
  const box = $("#about");
  const events = city.zones.reduce((n, z) => n + z.events.length, 0);
  replace(
    $("#about-body"),
    h(
      "p",
      {},
      `${city.meta.title}把台南拆成 ${city.zones.length} 座六邊形島嶼，每座島對應一類真實新聞，目前收錄 ${events} 則事件。`,
    ),
    h("h3", {}, "收錄原則"),
    h(
      "ul",
      {},
      h("li", {}, city.meta.period.note),
      h("li", {}, "每則事件至少附一則可開啟的原始報導，文字只摘要報導內容。"),
      h(
        "li",
        {},
        "拿掉受害者、一般民眾與被告的姓名；原始報導標題照錄，其中的一般人與被告姓名以「○○」遮蔽，現任公職人員以公職身分出現者不遮蔽。",
      ),
      h(
        "li",
        {},
        "司法案件依報導當時的偵辦或審理階段描述；已判無罪定讞的案件不收錄。",
      ),
    ),
    h("p", { class: "helpline" }, city.meta.helpline),
  );
  const modal = createModal(box);
  $$("[data-action='about']").forEach((btn) => btn.addEventListener("click", () => modal.open($("#about-close"))));
  $("#about-close").addEventListener("click", modal.close);
};

export const mountDialogs = (city) => {
  mountIntro(city);
  mountAbout(city);
};
