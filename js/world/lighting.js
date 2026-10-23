import * as THREE from "three";

const KEYFRAMES = [
  { at: 0, sky: "#0b0a14", sea: "#0e1a2b", hemi: 0.35, sun: "#6b7cff", sunI: 0.25, elev: -0.3, lamps: 1 },
  { at: 330, sky: "#1d1a33", sea: "#1b2d45", hemi: 0.45, sun: "#9a8cff", sunI: 0.4, elev: 0.05, lamps: 0.8 },
  { at: 420, sky: "#f3b58c", sea: "#577a96", hemi: 0.8, sun: "#ffb27a", sunI: 1.2, elev: 0.25, lamps: 0.2 },
  { at: 720, sky: "#a9d1ec", sea: "#4c86ab", hemi: 1.05, sun: "#fff4e0", sunI: 1.9, elev: 1.1, lamps: 0 },
  { at: 1020, sky: "#f0a36b", sea: "#4f6f8c", hemi: 0.85, sun: "#ff9a52", sunI: 1.4, elev: 0.35, lamps: 0.3 },
  { at: 1110, sky: "#7a2f3d", sea: "#2a3550", hemi: 0.6, sun: "#ff5a3a", sunI: 0.9, elev: 0.08, lamps: 0.7 },
  { at: 1260, sky: "#120f1e", sea: "#0f1b2e", hemi: 0.38, sun: "#7385ff", sunI: 0.3, elev: -0.2, lamps: 1 },
  { at: 1440, sky: "#0b0a14", sea: "#0e1a2b", hemi: 0.35, sun: "#6b7cff", sunI: 0.25, elev: -0.3, lamps: 1 },
];

const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
const lerp = (a, b, k) => a + (b - a) * k;

export const sampleTime = (minutes) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  const i = KEYFRAMES.findIndex((f) => f.at > m);
  const b = KEYFRAMES[Math.max(1, i)];
  const a = KEYFRAMES[Math.max(0, i - 1)];
  const k = (m - a.at) / Math.max(1, b.at - a.at);
  return {
    sky: mix(a.sky, b.sky, k),
    sea: mix(a.sea, b.sea, k),
    sun: mix(a.sun, b.sun, k),
    hemi: lerp(a.hemi, b.hemi, k),
    sunI: lerp(a.sunI, b.sunI, k),
    elev: lerp(a.elev, b.elev, k),
    lamps: lerp(a.lamps, b.lamps, k),
  };
};

export const createLights = (scene, span) => {
  const hemi = new THREE.HemisphereLight("#ffffff", "#3a3040", 0.8);
  const sun = new THREE.DirectionalLight("#ffffff", 1.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const ext = span * 0.75;
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 0.5, far: span * 4 });
  sun.shadow.bias = -0.0008;
  const moon = new THREE.PointLight("#8fa6ff", 0, span * 3);
  scene.add(hemi, sun, sun.target, moon);

  const apply = (minutes, center) => {
    const s = sampleTime(minutes);
    const dist = span * 1.6;
    const azim = (minutes / 1440) * Math.PI * 2;
    const elev = Math.max(0.12, s.elev);
    sun.position.set(center.x + Math.cos(azim) * dist, Math.sin(elev) * dist + 2, center.z + Math.sin(azim) * dist * 0.6 - dist * 0.4);
    sun.target.position.set(center.x, 0, center.z);
    sun.color.copy(s.sun);
    sun.intensity = s.sunI;
    hemi.intensity = s.hemi;
    hemi.color.copy(s.sky).lerp(new THREE.Color("#ffffff"), 0.5);
    moon.position.set(center.x, span, center.z);
    moon.intensity = s.lamps * 0.6;
    scene.background = s.sky;
    scene.fog.color.copy(s.sky);
    return s;
  };
  return { apply };
};
