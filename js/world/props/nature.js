import { box, cyl, ball, cone, disc, group, at, mat, glowMat, house, tree, scatter } from "../kit.js";

const water = (color, opacity = 0.85) => mat(color, { transparent: true, opacity, roughness: 0.2, metalness: 0.3 });

export const solar = (rand) => {
  const panel = mat("#1f3b73", { metalness: 0.6, roughness: 0.25 });
  const pond = disc(0.78, water("#5d8fa8"), [0, 0.005, 0]);
  const panels = [];
  for (let r = -3; r <= 3; r += 1) {
    for (let c = -3; c <= 3; c += 1) {
      const x = c * 0.17 + (r % 2) * 0.05;
      const z = r * 0.17;
      if (Math.hypot(x, z) < 0.62) panels.push(group(cyl(0.006, 0.006, 0.08, "#888", [x, 0, z], 4), box(0.14, 0.012, 0.1, panel, [x, 0.08, z], [-0.35, 0, 0])));
    }
  }
  const egret = group(ball(0.025, "#f8f8f8", [0.55, 0.02, 0.3]), cyl(0.004, 0.004, 0.03, "#333", [0.55, 0, 0.3], 3));
  return { group: group(pond, panels, egret), tick: (t) => { egret.position.y = Math.max(0, Math.sin(t * 0.6)) * 0.2; } };
};

export const river = (rand) => {
  const murk = water("#5b5a2e", 0.95);
  const segs = Array.from({ length: 7 }, (_, i) => box(0.3, 0.02, 0.3, murk, [-0.6 + i * 0.2, 0, Math.sin(i * 0.9) * 0.18], [0, Math.cos(i * 0.9) * 0.6, 0]));
  const fish = scatter(rand, 8, 0.5, ([x, , z]) => at(ball(0.025, "#e8e4da"), [x, 0.015, Math.sin((x + 0.6) * 4.5) * 0.18], rand() * 3));
  fish.forEach((f) => f.scale.set(1.8, 0.5, 0.8));
  const pipe = group(cyl(0.04, 0.04, 0.3, "#6b6b6b", [0.25, 0.06, -0.45], 8, [0, 0, Math.PI / 2]), box(0.25, 0.25, 0.22, "#7a7064", [0.5, 0, -0.45]));
  const drip = Array.from({ length: 4 }, () => ball(0.015, "#4a3a1a", [0.1, 0.06, -0.45]));
  const reeds = scatter(rand, 10, 0.7, ([x, , z]) => cone(0.015, 0.12, "#6f7f3a", [x, 0, z], 4));
  return {
    group: group(segs, fish, pipe, drip, reeds),
    tick: (t) => {
      fish.forEach((f, i) => { f.position.y = 0.015 + Math.sin(t * 1.2 + i) * 0.008; });
      drip.forEach((d, i) => {
        const p = (t * 0.8 + i / drip.length) % 1;
        d.position.set(0.1 - p * 0.05, 0.06 - p * 0.06, -0.45);
      });
    },
  };
};

export const float = (rand) => {
  const sea = disc(0.62, water("#3f6475"), [-0.05, 0.005, 0.05], 24);
  const body = at(group(box(0.2, 0.03, 0.07, "#2b2b30"), ball(0.035, "#2b2b30", [0.12, -0.02, 0])), [-0.05, 0.02, 0.05], 0.6);
  const ripples = [0, 1, 2].map(() => cyl(0.12, 0.12, 0.004, mat("#d9eef7", { transparent: true, opacity: 0.6 }), [-0.05, 0.02, 0.05], 24));
  const pier = group(box(0.5, 0.03, 0.1, "#7a5a3a", [0.45, 0.04, -0.35], [0, 0.5, 0]), ...[0, 1, 2].map((i) => cyl(0.012, 0.012, 0.08, "#4a3a2a", [0.28 + i * 0.15, 0, -0.42 + i * 0.08], 6)));
  const boat = group(box(0.18, 0.05, 0.07, "#e8e1d4", [0.35, 0.01, 0.4]), box(0.06, 0.06, 0.05, "#2c6db5", [0.33, 0.06, 0.4]));
  const lamp = glowMat("#ffd88f", 1.6);
  const lighthouse = group(cyl(0.04, 0.06, 0.4, "#f5f0e8", [-0.55, 0, -0.35], 8), ball(0.035, lamp, [-0.55, 0.4, -0.35]));
  return {
    group: group(sea, body, ripples, pier, boat, lighthouse),
    tick: (t) => {
      body.position.y = 0.02 + Math.sin(t) * 0.006;
      body.rotation.y = 0.6 + Math.sin(t * 0.3) * 0.2;
      ripples.forEach((r, i) => {
        const p = (t * 0.25 + i / 3) % 1;
        r.scale.setScalar(0.5 + p * 2.2);
        r.material.opacity = 0.6 * (1 - p);
      });
      boat.rotation.z = Math.sin(t * 1.3) * 0.08;
    },
  };
};

export const flood = (rand) => {
  const houses = [[-0.4, -0.3], [-0.05, -0.4], [0.35, -0.25], [-0.3, 0.2], [0.15, 0.1], [0.45, 0.3]].map(([x, z]) => house(0.2, 0.22, 0.2, "#c9bfae", ["#a8201a", "#2c6db5", "#5a5a5a"][Math.floor(rand() * 3)], [x, 0, z]));
  const flood = disc(0.88, water("#7a6a45", 0.8), [0, 0.1, 0]);
  const debris = scatter(rand, 9, 0.6, ([x, , z]) => box(0.05, 0.015, 0.03, ["#e8e1d4", "#2c6db5", "#c0392b"][Math.floor(rand() * 3)], [x, 0.12, z], [0, rand() * 3, 0]));
  const scooter = box(0.1, 0.04, 0.04, "#2e8b57", [0.05, 0.08, 0.4]);
  const rain = Array.from({ length: 30 }, () => box(0.004, 0.06, 0.004, mat("#cfe3ff", { transparent: true, opacity: 0.6 }), [(rand() - 0.5) * 1.4, rand(), (rand() - 0.5) * 1.4]));
  return {
    group: group(houses, flood, debris, scooter, rain),
    tick: (t) => {
      flood.position.y = 0.09 + Math.sin(t * 0.5) * 0.02;
      debris.forEach((d, i) => { d.position.y = flood.position.y + 0.015 + Math.sin(t + i) * 0.004; });
      rain.forEach((r, i) => { r.position.y = 1.2 - ((t * 1.6 + i * 0.13) % 1.2); });
    },
  };
};

export const dengue = (rand) => {
  const homes = [[-0.4, -0.3], [0.1, -0.45], [0.45, -0.1]].map(([x, z]) => house(0.24, 0.24, 0.22, "#bfb5a4", "#6c5a4a", [x, 0, z]));
  const tires = scatter(rand, 5, 0.3, ([x, , z]) => group(cyl(0.07, 0.07, 0.04, "#1b1b1b", [x - 0.1, 0, z + 0.25], 12), disc(0.045, water("#4c6b4f"), [x - 0.1, 0.03, z + 0.25], 12)));
  const buckets = scatter(rand, 4, 0.25, ([x, , z]) => cyl(0.05, 0.04, 0.08, ["#2c6db5", "#e84393", "#fdcb6e"][Math.floor(rand() * 3)], [x + 0.25, 0, z + 0.2], 10));
  const swarm = Array.from({ length: 26 }, () => ball(0.008, "#111", [0, 0, 0], 0));
  const seeds = swarm.map(() => [rand() * 6.28, 0.1 + rand() * 0.45, rand() * 0.4, 0.5 + rand()]);
  const sign = group(cyl(0.01, 0.01, 0.25, "#777", [-0.55, 0, 0.2], 4), box(0.16, 0.1, 0.01, glowMat("#ff3b30", 0.8), [-0.55, 0.22, 0.2]));
  return {
    group: group(homes, tires, buckets, swarm, sign),
    tick: (t) => swarm.forEach((m, i) => {
      const [a, r, y, s] = seeds[i];
      m.position.set(Math.cos(a + t * s * 2) * r, 0.12 + y + Math.sin(t * 5 + i) * 0.03, Math.sin(a + t * s * 2) * r);
    }),
  };
};

export const garbage = (rand) => {
  const colors = ["#e8e6e0", "#d0cdc4", "#3a3a3a", "#2c6db5", "#b9b39f"];
  const mound = Array.from({ length: 70 }, (_, i) => {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.5;
    const h = Math.max(0, 0.42 - r * 0.8) * rand();
    return ball(0.06 + rand() * 0.05, colors[i % colors.length], [Math.cos(a) * r - 0.1, h, Math.sin(a) * r - 0.1], 0);
  });
  const bales = scatter(rand, 8, 0.2, ([x, , z]) => box(0.12, 0.12, 0.12, "#f2f0ea", [x + 0.45, 0, z + 0.25], [0, rand(), 0]));
  const truck = group(box(0.3, 0.14, 0.16, "#2e6e4e", [0.35, 0.01, -0.45]), box(0.1, 0.1, 0.15, "#e6c23a", [0.55, 0.01, -0.45]));
  const flies = Array.from({ length: 14 }, () => ball(0.007, "#111", [0, 0, 0], 0));
  const smoke = ball(0.08, mat("#7a7a70", { transparent: true, opacity: 0.4 }), [-0.1, 0.5, -0.1]);
  return {
    group: group(mound, bales, truck, flies, smoke),
    tick: (t) => {
      flies.forEach((f, i) => f.position.set(-0.1 + Math.cos(t * 3 + i) * 0.25, 0.5 + Math.sin(t * 4 + i * 2) * 0.08, -0.1 + Math.sin(t * 3 + i) * 0.25));
      const p = (t * 0.15) % 1;
      smoke.position.y = 0.45 + p * 0.6;
      smoke.scale.setScalar(1 + p * 2);
      smoke.material.opacity = 0.4 * (1 - p);
    },
  };
};

export const dioxin = (rand) => {
  const rust = "#7a4a2a";
  const toxic = glowMat("#7dff4a", 0.9);
  const factory = group(box(0.5, 0.28, 0.3, "#5a564e", [-0.15, 0, -0.3]), box(0.52, 0.03, 0.32, "#3a3630", [-0.15, 0.28, -0.3]), ...[-0.3, -0.1].map((x) => cyl(0.04, 0.05, 0.55, "#6a6058", [x, 0.28, -0.35], 8)));
  const tanks = [[0.35, -0.3], [0.5, 0.05]].map(([x, z]) => cyl(0.1, 0.1, 0.2, rust, [x, 0, z], 10));
  const pool = disc(0.25, toxic, [-0.1, 0.004, 0.25], 16);
  const barrels = scatter(rand, 7, 0.18, ([x, , z]) => cyl(0.03, 0.03, 0.07, ["#c9a227", rust, "#2c6db5"][Math.floor(rand() * 3)], [x + 0.25, 0, z + 0.35], 8, rand() > 0.6 ? [Math.PI / 2, 0, rand()] : undefined));
  const fence = Array.from({ length: 9 }, (_, i) => box(0.012, 0.12, 0.012, "#999", [-0.6 + i * 0.15, 0, 0.6]));
  const skull = group(box(0.14, 0.14, 0.01, "#f2d200", [-0.5, 0.06, 0.1], [0, 0.5, Math.PI / 4]), cyl(0.008, 0.008, 0.08, "#777", [-0.5, 0, 0.1], 4));
  const fumes = Array.from({ length: 4 }, () => ball(0.05, mat("#a8c070", { transparent: true, opacity: 0.4 }), [-0.3, 0.85, -0.35]));
  return {
    group: group(factory, tanks, pool, barrels, fence, skull, fumes),
    tick: (t) => {
      toxic.emissiveIntensity = 0.6 + Math.sin(t * 1.5) * 0.4;
      fumes.forEach((f, i) => {
        const p = (t * 0.18 + i / 4) % 1;
        f.position.set(-0.3 + p * 0.15, 0.85 + p * 0.5, -0.35);
        f.scale.setScalar(1 + p * 1.8);
        f.material.opacity = 0.45 * (1 - p);
      });
    },
  };
};

export const food = (rand) => {
  const awning = ["#c0392b", "#16a085", "#e6b422"];
  const stalls = [-0.4, 0, 0.4].map((x, i) => group(box(0.28, 0.12, 0.18, "#a88c6a", [x, 0, -0.3]), box(0.32, 0.02, 0.24, awning[i], [x, 0.28, -0.3], [0.15, 0, 0]), cyl(0.008, 0.008, 0.28, "#777", [x - 0.14, 0, -0.2], 4), cyl(0.008, 0.008, 0.28, "#777", [x + 0.14, 0, -0.2], 4)));
  const pots = [-0.4, 0, 0.4].map((x) => cyl(0.07, 0.06, 0.07, "#8a8f94", [x, 0.12, -0.32], 12));
  const steam = Array.from({ length: 6 }, (_, i) => ball(0.03, mat("#ffffff", { transparent: true, opacity: 0.5 }), [-0.4 + (i % 3) * 0.4, 0.2, -0.32]));
  const tables = scatter(rand, 4, 0.3, ([x, , z]) => group(cyl(0.08, 0.08, 0.015, "#e84393", [x, 0.08, z + 0.25], 12), cyl(0.01, 0.01, 0.08, "#777", [x, 0, z + 0.25], 4), cyl(0.03, 0.025, 0.025, "#f5f0e8", [x, 0.095, z + 0.25], 10)));
  const crate = box(0.14, 0.1, 0.1, "#6b4a2b", [0.55, 0, 0.2]);
  const xmark = box(0.2, 0.02, 0.02, glowMat("#ff3b30", 1.4), [0.55, 0.14, 0.26], [0, 0, 0.7]);
  const xmark2 = box(0.2, 0.02, 0.02, glowMat("#ff3b30", 1.4), [0.55, 0.14, 0.26], [0, 0, -0.7]);
  return {
    group: group(stalls, pots, steam, tables, crate, xmark, xmark2),
    tick: (t) => steam.forEach((s, i) => {
      const p = (t * 0.4 + i * 0.37) % 1;
      s.position.y = 0.2 + p * 0.35;
      s.material.opacity = 0.5 * (1 - p);
    }),
  };
};

export const wild = (rand) => {
  const hills = scatter(rand, 3, 0.4, ([x, , z]) => cone(0.25 + rand() * 0.15, 0.25 + rand() * 0.3, "#5f7a4a", [x, 0, z], 7));
  const trees = scatter(rand, 12, 0.72, ([x, , z]) => tree(0.8 + rand() * 0.6, ["#4f6b3a", "#5d7b44", "#3f5a30"][Math.floor(rand() * 3)], [x, 0, z]));
  return { group: group(hills, trees) };
};
