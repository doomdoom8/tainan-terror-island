export const INITIAL_STATE = Object.freeze({
  zoneId: null,
  eventId: null,
  time: 1260,
  monthIndex: null,
  cumulative: false,
  isle: null,
  fears: [],
  query: "",
  sideOpen: true,
  names: true,
  frozen: false,
  bird: false,
  overview: false,
  touring: false,
  homeTick: 0,
});

export const createStore = (initial) => {
  let state = Object.freeze({ ...initial });
  const listeners = new Set();
  let pending = [];
  let notifying = false;

  const resolve = (patch) => {
    try {
      const next = typeof patch === "function" ? patch(state) : patch;
      if (!next || typeof next !== "object")
        throw new TypeError("store.set 需要物件或回傳物件的函式");
      return { next };
    } catch (err) {
      return { error: err };
    }
  };

  const apply = (patch) => {
    const { next, error } = resolve(patch);
    if (error) return [error];
    const changed = Object.keys(next).filter((k) => next[k] !== state[k]);
    if (changed.length === 0) return [];
    const prev = state;
    const current = Object.freeze({ ...state, ...next });
    state = current;
    return [...listeners].flatMap((fn) => {
      try {
        fn(current, prev, changed);
        return [];
      } catch (err) {
        return [err];
      }
    });
  };

  const drain = () => {
    notifying = true;
    let errors = [];
    while (pending.length > 0) {
      const [patch, ...rest] = pending;
      pending = rest;
      errors = [...errors, ...apply(patch)];
    }
    notifying = false;
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1)
      throw new AggregateError(errors, errors.map((e) => e.message).join("; "));
  };

  return {
    get: () => state,
    set: (patch) => {
      pending = [...pending, patch];
      if (!notifying) drain();
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};

export const toggleIn = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
