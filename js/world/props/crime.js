import { box, cyl, ball, cone, group, at, mat, glowMat, policeCar, car, blink, scatter } from "../kit.js";

const shophouse = (rand, x, z, rotY, lit) => {
  const h = 0.32 + rand() * 0.3;
  const sign = glowMat(["#ff4d6d", "#ffd23f", "#3ae0ff", "#ff7b1c"][Math.floor(rand() * 4)], 1.4);
  return at(
    group(
      box(0.2, h, 0.22, ["#8a7d74", "#9a8b7a", "#6f6862"][Math.floor(rand() * 3)]),
      box(0.21, 0.04, 0.23, lit, [0, h * 0.55, 0]),
      box(0.02, 0.12, 0.08, sign, [0.11, h * 0.6, 0]),
      box(0.18, 0.1, 0.01, "#4a4442", [0, 0, 0.115]),
    ),
    [x, 0, z],
    rotY,
  );
};

export const gun = (rand) => {
  const lit = glowMat("#ffcf7a", 0.6);
  const flash = glowMat("#fff3b0", 0);
  const row = (z, rotY) => [-0.45, -0.22, 0.01, 0.24, 0.47].map((x) => shophouse(rand, x, z, rotY, lit));
  const casings = scatter(rand, 9, 0.18, ([x, , z]) => cyl(0.012, 0.012, 0.035, mat("#d4a531", { metalness: 0.8, roughness: 0.3 }), [x + 0.1, 0, z], 6, [Math.PI / 2, rand() * 3, 0]));
  const police = [policeCar([-0.35, 0, 0.03], 0.3), policeCar([0.42, 0, -0.05], -0.2)];
  const tape = box(0.9, 0.012, 0.012, glowMat("#ffd400", 0.8), [0, 0.1, 0.02]);
  const pistol = at(group(box(0.12, 0.035, 0.03, "#1a1a1a"), box(0.035, 0.07, 0.03, "#1a1a1a", [-0.04, -0.06, 0])), [0.05, 0.08, 0.02]);
  const muzzle = ball(0.03, flash, [0.13, 0.065, 0.02]);
  const g = group(row(-0.3, 0), row(0.33, Math.PI), box(1.1, 0.01, 0.3, "#3a3436", [0, 0, 0.02]), casings, police.map((p) => p.car), tape, pistol, muzzle);
  const lights = police.flatMap((p) => [p.red, p.blue]);
  return {
    group: g,
    tick: (t) => {
      blink(lights, t, 9);
      flash.emissiveIntensity = Math.sin(t * 2.3) > 0.97 ? 4 : 0;
    },
  };
};

const temple = (pos) => {
  const red = "#a8201a";
  const roof = mat("#3b2a22");
  const lantern = glowMat("#ff5a36", 1.2);
  return {
    lantern,
    group: at(
      group(
        box(0.4, 0.04, 0.3, "#c9b9a6"),
        box(0.34, 0.18, 0.24, red, [0, 0.04, 0]),
        box(0.46, 0.04, 0.34, roof, [0, 0.22, 0]),
        box(0.3, 0.06, 0.2, roof, [0, 0.26, 0]),
        ball(0.025, lantern, [-0.12, 0.12, 0.13]),
        ball(0.025, lantern, [0.12, 0.12, 0.13]),
      ),
      pos,
      0.2,
    ),
  };
};

export const street = (rand) => {
  const lamp = glowMat("#fff0c0", 1.5);
  const shrine = temple([-0.35, 0, -0.3]);
  const police = [policeCar([0.2, 0, 0.15], 1.2), policeCar([0.45, 0, -0.15], 2.2), policeCar([-0.2, 0, 0.35], 0.4)];
  const posts = [[-0.05, 0.05], [0.5, 0.25], [0.3, 0.5], [-0.15, 0.45]];
  const tape = posts.map(([x, z], i) => {
    const [nx, nz] = posts[(i + 1) % posts.length];
    const len = Math.hypot(nx - x, nz - z);
    return box(len, 0.012, 0.012, glowMat("#ffd400", 0.8), [(x + nx) / 2, 0.09, (z + nz) / 2], [0, -Math.atan2(nz - z, nx - x), 0]);
  });
  const cones = posts.map(([x, z]) => cone(0.025, 0.1, "#ff6a00", [x, 0, z], 6));
  const blocks = [[0.35, -0.45], [0.6, 0.0], [-0.55, 0.2]].map(([x, z]) => box(0.22, 0.3 + rand() * 0.3, 0.2, "#6c6f78", [x, 0, z]));
  const lampPost = group(cyl(0.01, 0.012, 0.42, "#333", [0.05, 0, -0.1]), ball(0.03, lamp, [0.05, 0.4, -0.1]));
  const knife = box(0.08, 0.008, 0.02, mat("#c8ccd2", { metalness: 0.9, roughness: 0.2 }), [0.18, 0, 0.32], [0, 0.6, 0]);
  const lights = police.flatMap((p) => [p.red, p.blue]);
  return {
    group: group(shrine.group, police.map((p) => p.car), tape, cones, blocks, lampPost, knife),
    tick: (t) => {
      blink(lights, t, 7);
      lamp.emissiveIntensity = Math.sin(t * 13) > -0.8 ? 1.5 : 0.1;
      shrine.lantern.emissiveIntensity = 1 + Math.sin(t * 2) * 0.3;
    },
  };
};

export const drug = (rand) => {
  const smoke = Array.from({ length: 6 }, (_, i) => ball(0.05 + i * 0.01, mat("#9fe0a0", { transparent: true, opacity: 0.5 }), [-0.3, 0.45, -0.2]));
  const lab = group(
    box(0.42, 0.24, 0.3, "#7a7468", [-0.3, 0, -0.2]),
    box(0.46, 0.03, 0.34, "#4b4038", [-0.3, 0.24, -0.2]),
    cyl(0.03, 0.03, 0.2, "#555", [-0.2, 0.26, -0.25]),
    box(0.1, 0.06, 0.01, glowMat("#7dff9a", 1.2), [-0.3, 0.1, -0.04]),
  );
  const packColors = ["#e84393", "#ffcc00", "#00b894", "#6c5ce7", "#ff7675"];
  const packets = scatter(rand, 14, 0.3, ([x, , z], i) => box(0.06, 0.012, 0.08, packColors[i % packColors.length], [x + 0.2, 0, z + 0.15], [0, rand() * 3, 0]));
  const pole = cyl(0.015, 0.015, 0.45, "#7a7a7a", [0.45, 0, -0.2]);
  const crashed = car("#c0392b", [0.32, 0, -0.18], 0.9, 0.1);
  const hazard = glowMat("#ffae00", 2);
  const flashers = [box(0.02, 0.02, 0.02, hazard, [0.24, 0.08, -0.26]), box(0.02, 0.02, 0.02, hazard, [0.36, 0.08, -0.06])];
  const police = policeCar([0.1, 0, 0.45], 2.6);
  const g = group(lab, smoke, packets, pole, crashed, flashers, police.car, box(1.2, 0.008, 0.16, "#2e2e30", [0.2, 0, -0.18], [0, 0.9, 0]));
  return {
    group: g,
    tick: (t) => {
      smoke.forEach((s, i) => {
        const p = (t * 0.25 + i / smoke.length) % 1;
        s.position.set(-0.2 + Math.sin(p * 6 + i) * 0.04, 0.46 + p * 0.6, -0.25);
        s.material.opacity = 0.55 * (1 - p);
      });
      blink([hazard], t, 5, 2);
      blink([police.red, police.blue], t, 8);
    },
  };
};
