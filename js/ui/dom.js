import { isSafeUrl } from "../data/schema.js";

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const setStyles = (el, styles) =>
  Object.entries(styles).forEach(([prop, val]) => {
    if (prop.startsWith("--")) el.style.setProperty(prop, val);
    else el.style[prop] = val;
  });

export const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === "class") el.className = v;
    else if (k === "style") setStyles(el, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  });
  children
    .flat(Infinity)
    .filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => {
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    });
  return el;
};

export const replace = (el, ...children) => {
  el.replaceChildren(...children.flat(Infinity).filter(Boolean));
  return el;
};

export const replaceKeepingFocus = (el, ...children) => {
  const key = el.contains(document.activeElement) ? document.activeElement.dataset.key : null;
  replace(el, ...children);
  if (!key) return el;
  const target = el.querySelector(`[data-key="${CSS.escape(key)}"]`) ?? el.querySelector("[data-key]");
  target?.focus();
  return el;
};

export const extLink = (href, ...children) =>
  isSafeUrl(href)
    ? h(
        "a",
        { href, target: "_blank", rel: "noopener noreferrer" },
        ...children,
      )
    : h("span", {}, ...children);

export const fearChip = (fear) =>
  h(
    "span",
    { class: "fear-chip", style: { "--c": fear.color } },
    h("i"),
    fear.name,
  );
