const DURATION = 1.1;

const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

export const createFlight = (camera, controls) => {
  let job = null;
  const cancel = () => {
    job = null;
  };
  controls.addEventListener("start", cancel);
  return {
    to: ({ pos, target }) => {
      job = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), pos, target, k: 0 };
    },
    tick: (dt) => {
      if (!job) return false;
      job.k = Math.min(1, job.k + dt / DURATION);
      const e = easeInOut(job.k);
      camera.position.lerpVectors(job.fromPos, job.pos, e);
      controls.target.lerpVectors(job.fromTarget, job.target, e);
      if (job.k >= 1) job = null;
      return true;
    },
  };
};
