import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { cellToXZ, gridCenter } from "./hex.js";
import { buildIsland, buildWild } from "./islands.js";
import { createLights } from "./lighting.js";
import { createFlight } from "./flight.js";

const CLICK_TOLERANCE_PX = 6;

const createRenderers = (stage) => {
  const gl = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  const css = new CSS2DRenderer();
  css.domElement.className = "labels";
  gl.domElement.setAttribute("role", "img");
  gl.domElement.setAttribute("aria-label", stage.dataset.label ?? "");
  stage.append(gl.domElement, css.domElement);
  return { gl, css };
};

const createSea = (center, span) => {
  const sea = new THREE.Mesh(
    new THREE.CircleGeometry(span * 3, 64),
    new THREE.MeshStandardMaterial({
      color: "#1b2d45",
      roughness: 0.35,
      metalness: 0.2,
    }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(center.x, -0.42, center.z);
  sea.receiveShadow = true;
  return sea;
};

const LANDSCAPE_ASPECT = 1.3;
const PORTRAIT_CROP = 0.62;

const fitScale = (aspect) =>
  Math.max(1, (LANDSCAPE_ASPECT / aspect) * PORTRAIT_CROP);

const homeView = (center, span, bird, aspect) => {
  const k = fitScale(aspect);
  const shiftX = k > 1 ? -0.8 : -1.5;
  if (bird) {
    return {
      pos: new THREE.Vector3(center.x, span * 1.55 * k, center.z + 0.01),
      target: new THREE.Vector3(center.x, 0, center.z),
    };
  }
  return {
    pos: new THREE.Vector3(
      center.x - span * 0.12 + shiftX,
      span * 0.92 * k,
      center.z + span * 1.12 * k,
    ),
    target: new THREE.Vector3(center.x + shiftX, 0, center.z + 0.9),
  };
};

const zoneView = (cell) => {
  const { x, z } = cellToXZ(cell);
  return {
    pos: new THREE.Vector3(x - 0.2, 2.6, z + 3.3),
    target: new THREE.Vector3(x, 0.1, z),
  };
};

export const createWorld = (stage, city, { onPick }) => {
  if (!window.WebGLRenderingContext) throw new Error("這個瀏覽器不支援 WebGL");
  const { gl, css } = createRenderers(stage);
  const scene = new THREE.Scene();
  const cells = [
    ...city.zones.map((z) => z.cell),
    ...(city.wilds ?? []).map((w) => w.cell),
  ];
  const center = gridCenter(cells);
  const span = center.span + 2;
  scene.fog = new THREE.Fog("#120f1e", span * 1.2, span * 3.2);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, span * 8);
  const controls = new OrbitControls(camera, gl.domElement);
  Object.assign(controls, {
    enableDamping: true,
    dampingFactor: 0.08,
    maxPolarAngle: 1.3,
    minDistance: 2,
    maxDistance: span * 4,
  });
  const lights = createLights(scene, span);
  const sea = createSea(center, span);
  const islands = city.zones.map((z) => buildIsland(z, onPick));
  const wilds = (city.wilds ?? []).map(buildWild);
  scene.add(sea, ...islands.map((i) => i.root), ...wilds.map((w) => w.root));
  const pickables = islands.flatMap((i) => i.pickables);
  const flight = createFlight(camera, controls);

  let frozen = false;
  let bird = false;
  let redraw = true;
  const invalidate = () => {
    redraw = true;
  };
  controls.addEventListener("change", invalidate);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = stage;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const k = fitScale(camera.aspect);
    scene.fog.near = span * 1.2 * k;
    scene.fog.far = span * 3.2 * k;
    gl.setSize(w, h);
    css.setSize(w, h);
    invalidate();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  const start = homeView(center, span, false, camera.aspect);
  camera.position.copy(start.pos);
  controls.target.copy(start.target);

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitZone = (x, y) => {
    const r = gl.domElement.getBoundingClientRect();
    ndc.set(
      ((x - r.left) / r.width) * 2 - 1,
      -((y - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, true)[0];
    return hit?.object.userData.zoneId ?? null;
  };
  let down = null;
  let hover = null;
  const canvas = gl.domElement;
  canvas.addEventListener("pointerdown", (ev) => {
    down = { x: ev.clientX, y: ev.clientY };
  });
  canvas.addEventListener("pointercancel", () => {
    down = null;
  });
  canvas.addEventListener("pointerup", (ev) => {
    const tap =
      down &&
      Math.hypot(ev.clientX - down.x, ev.clientY - down.y) <=
        CLICK_TOLERANCE_PX;
    down = null;
    if (tap) onPick(hitZone(ev.clientX, ev.clientY));
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (ev.buttons || ev.pointerType === "touch") return;
    hover = { x: ev.clientX, y: ev.clientY };
  });

  const clock = new THREE.Clock();
  let elapsed = 0;
  gl.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (hover) {
      canvas.style.cursor = hitZone(hover.x, hover.y) ? "pointer" : "grab";
      hover = null;
    }
    if (!frozen) elapsed += dt;
    const flying = flight.tick(dt);
    controls.update();
    const settling = islands
      .map((i) => i.tick(elapsed, dt, !frozen))
      .some(Boolean);
    if (frozen && !flying && !settling && !redraw) return;
    redraw = false;
    gl.render(scene, camera);
    css.render(scene, camera);
  });

  const withRedraw =
    (fn) =>
    (...args) => {
      invalidate();
      return fn(...args);
    };

  return {
    setTime: withRedraw((minutes) => {
      const s = lights.apply(minutes, center);
      sea.material.color.copy(s.sea);
    }),
    focusZone: withRedraw((id) => {
      const zone = city.zones.find((z) => z.id === id);
      if (zone) flight.to(zoneView(zone.cell));
    }),
    home: withRedraw(() =>
      flight.to(homeView(center, span, bird, camera.aspect)),
    ),
    setBird: withRedraw((on) => {
      bird = on;
    }),
    setFrozen: withRedraw((on) => {
      frozen = on;
    }),
    setSelected: withRedraw((id) =>
      islands.forEach((i) => i.setSelected(i.id === id)),
    ),
    setVisible: withRedraw((visibleIds) =>
      islands.forEach((i) => {
        i.setVisible(visibleIds.has(i.id));
        i.label.classList.toggle("off", !visibleIds.has(i.id));
      }),
    ),
    setAwake: withRedraw((awakeIds) =>
      islands.forEach((i) => {
        i.setAwake(awakeIds.has(i.id));
        i.label.classList.toggle("awake", awakeIds.has(i.id));
      }),
    ),
    setActiveLabel: (id) =>
      islands.forEach((i) => i.label.classList.toggle("active", i.id === id)),
    setNames: (on) => css.domElement.classList.toggle("hide-names", !on),
  };
};
