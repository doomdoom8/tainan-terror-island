import * as THREE from "three";

export const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, flatShading: true, ...opts });

export const glowMat = (color, intensity = 1.6) => mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.4 });

const finish = (mesh, [x, y, z], rot) => {
  mesh.position.set(x, y, z);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const material = (color) => (color instanceof THREE.Material ? color : mat(color));

export const box = (w, h, d, color, [x = 0, y = 0, z = 0] = [], rot) =>
  finish(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color)), [x, y + h / 2, z], rot);

export const cyl = (rTop, rBottom, h, color, [x = 0, y = 0, z = 0] = [], seg = 10, rot) =>
  finish(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), material(color)), [x, y + h / 2, z], rot);

export const cone = (r, h, color, [x = 0, y = 0, z = 0] = [], seg = 8, rot) =>
  finish(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), material(color)), [x, y + h / 2, z], rot);

export const ball = (r, color, [x = 0, y = 0, z = 0] = [], detail = 1) =>
  finish(new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), material(color)), [x, y + r, z]);

export const ring = (r, tube, color, [x = 0, y = 0, z = 0] = []) =>
  finish(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 24), material(color)), [x, y, z], [Math.PI / 2, 0, 0]);

export const disc = (r, color, [x = 0, y = 0, z = 0] = [], seg = 6) =>
  finish(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, seg), material(color)), [x, y + 0.01, z]);

export const group = (...children) => {
  const g = new THREE.Group();
  children.flat().filter(Boolean).forEach((c) => g.add(c));
  return g;
};

export const at = (obj, [x = 0, y = 0, z = 0], rotY = 0) => {
  obj.position.set(x, y, z);
  obj.rotation.y = rotY;
  return obj;
};

export const scatter = (rand, count, radius, make) =>
  Array.from({ length: count }, (_, i) => {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius;
    return make([Math.cos(a) * r, 0, Math.sin(a) * r], i);
  });

export const house = (w, h, d, wall, roof, pos = [0, 0, 0], rotY = 0) =>
  at(group(box(w, h, d, wall), cone(Math.max(w, d) * 0.75, h * 0.5, roof, [0, h, 0], 4, [0, Math.PI / 4, 0])), pos, rotY);

export const tower = (w, h, d, wall, windowMat, pos = [0, 0, 0], rotY = 0) => {
  const rows = Math.max(1, Math.floor(h / 0.12));
  const windows = Array.from({ length: rows }, (_, i) => box(w * 1.02, 0.03, d * 1.02, windowMat, [0, 0.07 + i * 0.12, 0]));
  return at(group(box(w, h, d, wall), ...windows), pos, rotY);
};

export const tree = (scale, color, pos = [0, 0, 0]) =>
  at(group(cyl(0.02 * scale, 0.03 * scale, 0.12 * scale, "#5a4630"), cone(0.12 * scale, 0.3 * scale, color, [0, 0.1 * scale, 0], 6)), pos);

export const policeCar = (pos = [0, 0, 0], rotY = 0) => {
  const red = glowMat("#ff2a2a", 2.4);
  const blue = glowMat("#2a6bff", 2.4);
  const car = group(
    box(0.32, 0.08, 0.16, "#f2f2f2", [0, 0.03, 0]),
    box(0.18, 0.06, 0.14, "#1d2a44", [0, 0.11, 0]),
    box(0.05, 0.03, 0.05, red, [0, 0.17, -0.03]),
    box(0.05, 0.03, 0.05, blue, [0, 0.17, 0.03]),
    ...[-0.1, 0.1].flatMap((x) => [-0.075, 0.075].map((z) => cyl(0.035, 0.035, 0.03, "#111", [x, 0, z], 8, [Math.PI / 2, 0, 0]))),
  );
  return { car: at(car, pos, rotY), red, blue };
};

export const car = (color, pos = [0, 0, 0], rotY = 0, tilt = 0) =>
  at(
    group(box(0.3, 0.07, 0.15, color, [0, 0.03, 0]), box(0.16, 0.06, 0.13, "#2b3440", [-0.02, 0.1, 0])),
    pos,
    rotY,
  ).rotateZ(tilt);

export const blink = (materials, t, speed, base = 2.4) =>
  materials.forEach((m, i) => {
    m.emissiveIntensity = Math.sin(t * speed + i * Math.PI) > 0 ? base : 0.1;
  });
