import {
    OBJECTS,
    type SafetyObject,
    type SceneObject,
  } from "../data/stage2Objects";
  
  import {
    ZONE_SLOTS,
    getFootprint,
    isOverlapping,
  } from "../data/stage2Zones";
  
  export function shuffle<T>(arr: T[]) {
    return [...arr].sort(() => Math.random() - 0.5);
  }
  
  export function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  export function makeScene(): SceneObject[] {
    const exitObjects = shuffle(
      OBJECTS.filter((o) => o.id === "exit_door_ok" || o.id === "exit_blocked")
    );
  
    const pickedExit = exitObjects[0];
  
    const safePool = shuffle(
      OBJECTS.filter((o) => o.type === "SAFE" && o.id !== "exit_door_ok")
    );
  
    const uaPool = shuffle(OBJECTS.filter((o) => o.type === "UA"));
  
    const ucPool = shuffle(
      OBJECTS.filter((o) => o.type === "UC" && o.id !== "exit_blocked")
    );
  
    const picked: SafetyObject[] = shuffle([
      pickedExit,
      ...safePool.slice(0, 2),
      ...uaPool.slice(0, 2),
      ...ucPool.slice(0, 1),
    ]);
  
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const result: SceneObject[] = [];
  
    picked.forEach((obj, index) => {
      const fp = getFootprint(obj);
  
      const slots =
        obj.id === "exit_door_ok" || obj.id === "exit_blocked"
          ? [{ x: 50, y: 18 }]
          : obj.id === "fire_extinguisher"
          ? [
              { x: 18, y: 24 },
              { x: 82, y: 24 },
            ]
          : ZONE_SLOTS[obj.zone];
  
      let best = slots[index % slots.length];
      let found = false;
  
      for (let i = 0; i < 50; i++) {
        const base = slots[rand(0, slots.length - 1)];
        const x = base.x + rand(-4, 4);
        const y = base.y + rand(-3, 3);
        const box = { x, y, w: fp.w, h: fp.h };
  
        if (!placed.some((p) => isOverlapping(box, p))) {
          best = { x, y };
          placed.push(box);
          found = true;
          break;
        }
      }
  
      if (!found) {
        placed.push({
          x: best.x,
          y: best.y,
          w: fp.w,
          h: fp.h,
        });
      }
  
      const baseScale =
        obj.type === "SAFE"
          ? rand(125, 145) / 100
          : rand(145, 165) / 100;
  
      result.push({
        ...obj,
        priority: obj.type === "SAFE" ? "SECONDARY" : "PRIMARY",
        uid: `${obj.id}-${Date.now()}-${index}`,
        x: best.x,
        y: best.y,
        size: obj.size * baseScale,
      });
    });
  
    return result;
  }