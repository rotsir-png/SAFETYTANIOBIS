import type {
    PlacementZone,
    SafetyObject,
  } from "./stage2Objects";
  
  export const ZONE_SLOTS: Record<
    PlacementZone,
    { x: number; y: number }[]
  > = {
    WALL: [
      { x: 50, y: 18 },
      { x: 24, y: 22 },
      { x: 76, y: 22 },
    ],
  
    CENTER: [
      { x: 22, y: 40 },
      { x: 50, y: 42 },
      { x: 78, y: 40 },
      { x: 30, y: 56 },
      { x: 50, y: 60 },
      { x: 70, y: 56 },
    ],
  
    FLOOR: [
      { x: 22, y: 72 },
      { x: 50, y: 76 },
      { x: 78, y: 72 },
      { x: 35, y: 84 },
      { x: 65, y: 84 },
    ],
  
    EDGE: [
      { x: 14, y: 36 },
      { x: 86, y: 36 },
      { x: 14, y: 56 },
      { x: 86, y: 56 },
      { x: 16, y: 74 },
      { x: 84, y: 74 },
    ],
  };
  
  export function getFootprint(obj: SafetyObject) {
    const wideIds = [
      "play_worker",
      "play_worker2",
      "forklift_safety",
      "exit_blocked",
      "leak_barrel",
    ];
  
    const base =
  obj.spawn === "HUMAN"
    ? 24
    : obj.spawn === "GROUND"
    ? 26
    : 22;
  
    const extra = wideIds.includes(obj.id) ? 8 : 0;
  
    return {
      w: base + extra,
      h: obj.spawn === "GROUND" ? 15 : 18,
    };
  }
  
  export function isOverlapping(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ) {
    return (
        Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 6 &&
        Math.abs(a.y - b.y) < (a.h + b.h) / 2 + 6
      );
  }