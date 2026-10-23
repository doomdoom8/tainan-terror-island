import { box, cyl, ball, cone, group, at, mat, glowMat, tower, house, car, scatter, blink, ring } from "../kit.js";

export const quake = (rand) => {
  const win = glowMat("#ffe2a8", 0.5);
  const collapsed = at(tower(0.3, 0.9, 0.3, "#b8b0a6", win), [0.05, 0.1, 0.05], 0.3);
  collapsed.rotation.z = -1.35;
  const rubble = scatter(rand, 22, 0.45, ([x, , z]) => box(0.04 + rand() * 0.07, 0.03 + rand() * 0.05, 0.04 + rand() * 0.06, ["#9b928a", "#7f766e", "#b5aca2"][Math.floor(rand() * 3)], [x, 0, z], [rand(), rand(), rand()]));
  const cracks = [0, 1, 2, 3].map((i) => box(0.6, 0.012, 0.025, "#1b1517", [0, 0, -0.1 + i * 0.12], [0, 0.4 + i * 0.5, 0]));
  const leaning = [tower(0.18, 0.6, 0.18, "#9e9a94", win, [-0.45, 0, -0.35]), tower(0.2, 0.45, 0.2, "#8c867f", win, [0.48, 0, -0.3])];
  leaning[0].rotation.z = 0.12;
  const g = group(collapsed, rubble, cracks, leaning);
  return { group: g, tick: (t) => { g.position.x = Math.sin(t * 40) * 0.004 * (Math.sin(t * 0.7) > 0.85 ? 1 : 0); } };
};

export const fire = (rand) => {
  const flames = [];
  const smoke = [];
  const houses = [-0.45, -0.15, 0.15, 0.45].map((x, i) => {
    const burning = i !== 3;
    const f = glowMat(i % 2 ? "#ff7b1c" : "#ffb02e", 2.2);
    const flame = cone(0.1, 0.28, f, [x, 0.3, -0.1], 6);
    if (burning) flames.push(flame);
    if (burning) smoke.push(ball(0.08, mat("#2a2626", { transparent: true, opacity: 0.6 }), [x, 0.6, -0.1]));
    return group(house(0.24, 0.3, 0.26, burning ? "#3a2c26" : "#8a7d70", "#4a2e22", [x, 0, -0.1]), burning ? flame : null);
  });
  const truck = group(box(0.36, 0.12, 0.16, "#c0392b", [0.1, 0.01, 0.35]), box(0.3, 0.02, 0.03, "#ddd", [0.2, 0.14, 0.35], [0, 0, 0.3]));
  const g = group(houses, smoke, truck, scatter(rand, 8, 0.3, ([x, , z]) => ball(0.025, glowMat("#ff5a1f", 1.6), [x, 0, z + 0.2])));
  return {
    group: g,
    tick: (t) => {
      flames.forEach((f, i) => f.scale.set(1, 0.8 + Math.abs(Math.sin(t * 9 + i * 2)) * 0.5, 1));
      smoke.forEach((s, i) => {
        const p = (t * 0.2 + i * 0.3) % 1;
        s.position.y = 0.55 + p * 0.7;
        s.scale.setScalar(1 + p * 1.5);
        s.material.opacity = 0.6 * (1 - p);
      });
    },
  };
};

export const fall = (rand) => {
  const win = glowMat("#cfe0ff", 0.4);
  const towers = [[-0.3, -0.2, 1.3], [0.15, -0.35, 1.0], [0.4, 0.15, 1.15], [-0.1, 0.3, 0.8]].map(([x, z, h]) => tower(0.22, h, 0.22, "#8f8a96", win, [x, 0, z]));
  const ghost = ball(0.05, glowMat("#e8f0ff", 1.8), [-0.3, 1.32, -0.2]);
  return { group: group(towers, ghost), tick: (t) => { ghost.material.emissiveIntensity = 1 + Math.sin(t * 2) * 0.8; } };
};

export const traffic = (rand) => {
  const asphalt = "#2f2f33";
  const stripes = Array.from({ length: 6 }, (_, i) => box(0.04, 0.012, 0.16, "#f2f2f2", [-0.18 + i * 0.07, 0, 0.28]));
  const amber = glowMat("#ffae00", 2);
  const signal = group(cyl(0.012, 0.012, 0.4, "#555", [0.3, 0, 0.3]), box(0.05, 0.12, 0.05, "#222", [0.3, 0.36, 0.3]), ball(0.018, amber, [0.3, 0.42, 0.33]));
  const cars = [car("#2c6db5", [-0.4, 0, -0.02], 0), car("#e0e0e0", [0.4, 0, 0.02], Math.PI), car("#c0392b", [0.05, 0, 0.05], 0.7, 0.3)];
  const scooter = at(group(box(0.12, 0.05, 0.04, "#2e8b57"), cyl(0.02, 0.02, 0.02, "#111", [0.05, -0.02, 0], 8, [Math.PI / 2, 0, 0])), [-0.05, 0.03, 0.15], 1.2);
  scooter.rotation.x = 1.4;
  const cones = [[-0.15, -0.1], [0.2, -0.12], [0.22, 0.18]].map(([x, z]) => cone(0.025, 0.1, "#ff6a00", [x, 0, z], 6));
  const g = group(box(1.5, 0.008, 0.36, asphalt), box(0.36, 0.008, 1.4, asphalt), stripes, signal, cars, scooter, cones);
  return { group: g, tick: (t) => blink([amber], t, 4, 2) };
};

export const work = (rand) => {
  const yellow = "#e6b422";
  const mast = group(...Array.from({ length: 8 }, (_, i) => box(0.06, 0.12, 0.06, i % 2 ? yellow : "#c9971b", [0.3, i * 0.12, -0.25])));
  const boom = at(group(box(0.9, 0.035, 0.035, yellow, [0.25, 0, 0]), box(0.2, 0.05, 0.06, "#666", [-0.25, -0.02, 0]), cyl(0.004, 0.004, 0.4, "#222", [0.6, -0.4, 0], 4), box(0.08, 0.06, 0.08, "#8a5a2b", [0.6, -0.46, 0])), [0.3, 0.98, -0.25]);
  const scaffold = group(
    ...[0, 1, 2, 3].flatMap((i) => [0, 1].map((j) => box(0.015, 0.6, 0.015, "#9aa0a6", [-0.5 + i * 0.12, 0, -0.2 + j * 0.2]))),
    ...[0.15, 0.3, 0.45].map((y) => box(0.38, 0.015, 0.22, "#a0762c", [-0.32, y, -0.1])),
  );
  const building = box(0.34, 0.5, 0.18, "#b3aca3", [-0.32, 0, -0.1]);
  const tank = cyl(0.14, 0.14, 0.3, "#9fb3c8", [0.2, 0, 0.3], 12);
  const warn = glowMat("#ff3b30", 1.8);
  const beacon = ball(0.02, warn, [0.3, 0.98, -0.25]);
  const hat = group(ball(0.03, yellow, [-0.05, 0, 0.35]), cyl(0.045, 0.045, 0.006, yellow, [-0.05, 0, 0.35]));
  return {
    group: group(mast, boom, scaffold, building, tank, beacon, hat),
    tick: (t) => {
      boom.rotation.y = Math.sin(t * 0.3) * 1.2;
      blink([warn], t, 3, 1.8);
    },
  };
};

export const kids = (rand) => {
  const colors = ["#e84393", "#fdcb6e", "#74b9ff", "#55efc4", "#ff7675", "#a29bfe"];
  const bulbs = glowMat("#fff0b3", 1.2);
  const horses = colors.map((c, i) => {
    const a = (i / colors.length) * Math.PI * 2;
    return group(cyl(0.005, 0.005, 0.26, "#ddd", [Math.cos(a) * 0.22, 0.04, Math.sin(a) * 0.22], 4), box(0.08, 0.05, 0.03, c, [Math.cos(a) * 0.22, 0.12, Math.sin(a) * 0.22], [0, -a, 0]));
  });
  const carousel = at(group(cyl(0.3, 0.3, 0.04, "#f5f0e8", [0, 0, 0], 16), cyl(0.03, 0.03, 0.34, "#c9a227", [0, 0.04, 0]), cone(0.34, 0.16, "#e84393", [0, 0.32, 0], 16), ring(0.31, 0.012, bulbs, [0, 0.31, 0]), horses), [-0.15, 0, -0.1]);
  const slide = group(box(0.05, 0.3, 0.05, "#74b9ff", [0.45, 0, 0.1]), box(0.08, 0.02, 0.38, "#fdcb6e", [0.45, 0.15, 0.3], [0.7, 0, 0]));
  const swing = group(box(0.01, 0.3, 0.01, "#888", [0.25, 0, -0.45]), box(0.01, 0.3, 0.01, "#888", [0.5, 0, -0.45]), box(0.27, 0.01, 0.01, "#888", [0.375, 0.3, -0.45]));
  const seat = box(0.08, 0.01, 0.05, "#ff7675", [0.375, 0.08, -0.45]);
  const balloon = group(cyl(0.002, 0.002, 0.3, "#ddd", [-0.5, 0, 0.35], 3), ball(0.05, "#c0392b", [-0.5, 0.3, 0.35]));
  return {
    group: group(carousel, slide, swing, seat, balloon),
    tick: (t) => {
      carousel.rotation.y = t * 0.4;
      seat.position.z = -0.45 + Math.sin(t * 1.6) * 0.07;
      balloon.position.y = Math.sin(t * 0.9) * 0.03;
    },
  };
};

export const graft = (rand) => {
  const gold = mat("#d4a531", { metalness: 0.7, roughness: 0.3 });
  const hall = group(
    box(0.7, 0.05, 0.4, "#d9d2c5", [0, 0, -0.25]),
    box(0.6, 0.28, 0.3, "#e8e1d4", [0, 0.05, -0.27]),
    ...Array.from({ length: 6 }, (_, i) => cyl(0.018, 0.018, 0.26, "#f5f0e8", [-0.25 + i * 0.1, 0.05, -0.1], 8)),
    cone(0.42, 0.14, "#a8201a", [0, 0.33, -0.27], 4, [0, Math.PI / 4, 0]),
    box(0.1, 0.12, 0.01, glowMat("#ffd27a", 0.6), [0, 0.06, -0.115]),
  );
  const bags = scatter(rand, 5, 0.25, ([x, , z]) => group(ball(0.07, "#c9a35a", [x, 0, z + 0.3]), cyl(0.02, 0.03, 0.04, "#8a6a2e", [x, 0.13, z + 0.3])));
  const stacks = scatter(rand, 7, 0.3, ([x, , z]) => cyl(0.04, 0.04, 0.02 + rand() * 0.12, gold, [x + 0.15, 0, z + 0.2], 12));
  const coin = cyl(0.07, 0.07, 0.015, gold, [-0.35, 0.3, 0.25], 16, [Math.PI / 2, 0, 0]);
  return { group: group(hall, bags, stacks, coin), tick: (t) => { coin.rotation.z = t * 2; coin.position.y = 0.3 + Math.sin(t * 2) * 0.04; } };
};

export const scam = (rand) => {
  const screens = Array.from({ length: 5 }, () => glowMat("#7fd1ff", 1));
  const block = group(box(0.4, 0.7, 0.3, "#5e5a6c", [-0.2, 0, -0.2]), ...Array.from({ length: 5 }, (_, i) => box(0.42, 0.05, 0.32, screens[i], [-0.2, 0.1 + i * 0.12, -0.2])));
  const antenna = group(cyl(0.008, 0.008, 0.3, "#999", [-0.2, 0.7, -0.2], 4), ball(0.02, glowMat("#ff3b30", 2), [-0.2, 1.0, -0.2]));
  const phones = scatter(rand, 7, 0.28, ([x, , z]) => box(0.05, 0.008, 0.09, glowMat("#9ff0ff", 1.4), [x + 0.2, 0.02, z + 0.2], [0, rand() * 3, 0]));
  const atm = group(box(0.12, 0.22, 0.1, "#2c3e50", [0.45, 0, -0.25]), box(0.08, 0.05, 0.01, glowMat("#3ae07a", 1.4), [0.45, 0.14, -0.2]));
  return {
    group: group(block, antenna, phones, atm),
    tick: (t) => {
      phones.forEach((p, i) => { p.position.y = 0.02 + Math.max(0, Math.sin(t * 12 + i * 1.7)) * 0.025; });
      screens.forEach((s, i) => { s.emissiveIntensity = 0.6 + Math.abs(Math.sin(t * 0.8 + i)) * 0.8; });
    },
  };
};
