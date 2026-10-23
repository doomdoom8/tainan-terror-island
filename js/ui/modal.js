const FOCUSABLE = "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])";

const setBackgroundInert = (box, on) =>
  [...box.parentElement.children].filter((el) => el !== box).forEach((el) => {
    el.inert = on;
  });

const trapTab = (box, e) => {
  const items = [...box.querySelectorAll(FOCUSABLE)];
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const outside = !box.contains(document.activeElement);
  if (e.shiftKey && (outside || document.activeElement === first)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (outside || document.activeElement === last)) {
    e.preventDefault();
    first.focus();
  }
};

export const createModal = (box, { onClose } = {}) => {
  let returnTo = null;
  const panel = box.firstElementChild;
  panel.tabIndex = -1;

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.stopImmediatePropagation();
      close();
    } else if (e.key === "Tab") {
      trapTab(box, e);
    }
  };

  const close = () => {
    if (box.hidden) return;
    box.hidden = true;
    document.removeEventListener("keydown", onKey, true);
    setBackgroundInert(box, false);
    onClose?.();
    returnTo?.focus?.();
    returnTo = null;
  };

  const open = (focusEl) => {
    returnTo = document.activeElement;
    box.hidden = false;
    setBackgroundInert(box, true);
    document.addEventListener("keydown", onKey, true);
    (focusEl ?? panel).focus();
  };

  box.addEventListener("click", (e) => {
    if (e.target === box) close();
  });

  return { open, close };
};
