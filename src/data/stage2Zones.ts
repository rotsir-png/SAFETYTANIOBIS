import type {
    PlacementZone,
    SafetyObject,
    } from "./stage2objects";
    
    export const ZONE_SLOTS: Record<PlacementZone,
  { x: number; y: number }[]
> = {WALL: [
    { x: 50, y: 18 },
    { x: 24, y: 22 },
    { x: 76, y: 22 },
    ],
    
    CENTER: [
    { x: 24, y: 45 },
    { x: 50, y: 48 },
    { x: 76, y: 45 },
    { x: 36, y: 58 },
    { x: 64, y: 58 },
    ],
    
    FLOOR: [
    { x: 24, y: 74 },
    { x: 50, y: 76 },
    { x: 76, y: 74 },
    ],
    
    EDGE: [
    { x: 16, y: 42 },
    { x: 84, y: 42 },
    { x: 18, y: 64 },
    { x: 82, y: 64 },
    ],
    };
    
    export function getFootprint(obj: SafetyObject) {
    const wideIds = [
    "play_worker",
    "play_worker2",
    "forklift_safety",
    "exit_blocked",
    ];
    
    const base =
    obj.spawn === "HUMAN"
    ? 15
    : obj.spawn === "GROUND"
    ? 17
    : 14;
    
    const extra = wideIds.includes(obj.id) ? 7 : 0;
    
    return {
    w: base + extra,
    h: obj.spawn === "GROUND" ? 13 : 16,
    };
    }
    
    export function isOverlapping(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
    ) {
    return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2
    );
    }
    