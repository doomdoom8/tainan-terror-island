import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { HEX_RADIUS, HEX_GAP, cellToXZ, seeded } from "./hex.js";
import { mat, glowMat } from "./kit.js";
import * as crime from "./props/crime.js";
import * as urban from "./props/urban.js";
import * as nature from "./props/nature.js";

const BUILDERS = { ...crime, ...urban, ...nature };
const ISLAND_HEIGHT = 0.36;
const WILD_HEIGHT = 0.22;
const DIM_OPACITY = 0.18;

const hexSlab = (height, ground, side) => {
  const geo = new THREE.CylinderGeometry(
    HEX_RADIUS - HEX_GAP,
    HEX_RADIUS - HEX_GAP * 0.4,
    height,
    6,
  );
  const mesh = new THREE.Mesh(geo, [mat(side), mat(ground), mat(side)]);
  mesh.position.y = -height / 2;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
};

const collectMaterials = (root) => {
  const list = [];
  const seen = new Set();
  root.traverse((o) => {
    if (!o.material) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (seen.has(m)) return;
      seen.add(m);
      list.push({
        m,
        opacity: m.opacity,
        transparent: m.transparent,
        depthWrite: m.depthWrite,
        emissive: m.emissiveIntensity ?? 0,
      });
    });
  });
  return list;
};

const chip = (zone, onPick) => {
  const el = document.createElement("button");
  el.className = "chip";
  el.dataset.zone = zone.id;
  el.type = "button";
  const num = document.createElement("b");
  num.textContent = String(zone.number).padStart(2, "0");
  const name = document.createElement("span");
  name.textContent = zone.name;
  el.append(num, name);
  el.setAttribute(
    "aria-label",
    `${zone.number} ${zone.name}（${zone.events.length} 則）`,
  );
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onPick(zone.id);
  });
  const obj = new CSS2DObject(el);
  obj.position.set(0, 0.95, 0);
  return { obj, el };
};

const awakeRing = () => {
  const m = glowMat("#ff3b2f", 0);
  m.transparent = true;
  m.opacity = 0;
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(HEX_RADIUS * 0.98, 0.025, 6, 6),
    m,
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.rotation.z = Math.PI / 6;
  mesh.position.y = 0.02;
  return mesh;
};

export const buildIsland = (zone, onPick) => {
  const root = new THREE.Group();
  const { x, z } = cellToXZ(zone.cell);
  root.position.set(x, 0, z);
  const slab = hexSlab(ISLAND_HEIGHT, zone.ground, zone.side);
  const build = BUILDERS[zone.model] ?? BUILDERS.wild;
  const props = build(seeded(zone.id));
  const ring = awakeRing();
  root.add(slab, props.group, ring);
  const materials = collectMaterials(root).filter((e) => e.m !== ring.material);
  const label = chip(zone, onPick);
  root.add(label.obj);
  slab.userData.zoneId = zone.id;
  props.group.traverse((o) => {
    o.userData.zoneId = zone.id;
  });

  let lift = 0;
  let liftTarget = 0;
  let opacity = 1;
  let opacityTarget = 1;
  let awake = false;

  const restoreBase = () =>
    materials.forEach(({ m, opacity: base, emissive }) => {
      m.opacity = base;
      if ("emissiveIntensity" in m) m.emissiveIntensity = emissive;
    });
  const applyDim = () =>
    materials.forEach(({ m, transparent, depthWrite }) => {
      m.transparent = transparent || opacity < 1;
      m.opacity *= opacity;
      m.depthWrite = depthWrite && opacity > 0.5;
      if ("emissiveIntensity" in m) m.emissiveIntensity *= opacity;
    });
  const stepOpacity = (dt) => {
    const gap = opacityTarget - opacity;
    if (Math.abs(gap) <= 0.002) {
      const changed = opacity !== opacityTarget;
      opacity = opacityTarget;
      return changed;
    }
    opacity += gap * Math.min(1, dt * 6);
    return true;
  };

  return {
    id: zone.id,
    root,
    pickables: [slab, props.group],
    label: label.el,
    setSelected: (on) => {
      liftTarget = on ? 0.18 : 0;
    },
    setVisible: (on) => {
      opacityTarget = on ? 1 : DIM_OPACITY;
    },
    setAwake: (on) => {
      awake = on;
    },
    tick: (t, dt, animate) => {
      lift += (liftTarget - lift) * Math.min(1, dt * 6);
      root.position.y = lift + (animate ? Math.sin(t * 0.6 + x) * 0.015 : 0);
      const fading = stepOpacity(dt);
      const adjusting = fading || opacity < 1;
      if (adjusting) restoreBase();
      ring.material.opacity = awake
        ? 0.6 + Math.sin(t * 4) * 0.35
        : Math.max(0, ring.material.opacity - dt * 2);
      ring.material.emissiveIntensity = awake ? 2 : 0;
      if (animate && props.tick) props.tick(t);
      if (adjusting) applyDim();
      return (
        fading ||
        Math.abs(lift - liftTarget) > 0.001 ||
        awake ||
        ring.material.opacity > 0
      );
    },
  };
};

export const buildWild = (wild) => {
  const root = new THREE.Group();
  const { x, z } = cellToXZ(wild.cell);
  root.position.set(x, -0.08, z);
  const props = BUILDERS.wild(seeded(wild.label + wild.cell.join()));
  root.add(hexSlab(WILD_HEIGHT, "#5a6b4c", "#34402c"), props.group);
  const el = document.createElement("span");
  el.className = "wild-label";
  el.textContent = wild.label;
  const obj = new CSS2DObject(el);
  obj.position.set(0, 0.5, 0);
  root.add(obj);
  return { root, label: el };
};
