export type ObjType = "SAFE" | "UA" | "UC";

export type SpawnKind = "GROUND" | "HUMAN" | "OBJECT";

export type PlacementZone =
  | "WALL"
  | "CENTER"
  | "FLOOR"
  | "EDGE";

export type SafetyObject = {
  id: string;
  label: string;
  image: string;
  type: ObjType;
  spawn: SpawnKind;
  size: number;
  collisionScale?: number;
  zone: PlacementZone;
};

export type SceneObject = SafetyObject & {
  uid: string;
  x: number;
  y: number;
  removing?: boolean;
  priority?: "PRIMARY" | "SECONDARY";
};

export const OBJECTS: SafetyObject[] = [
    // =========================
    // SAFE
    // =========================
    
    {
    id: "clean_floor",
    label: "พื้นสะอาด",
    image: "/assets/safety-grid/Safe/Clean Floor.png",
    type: "SAFE",
    spawn: "GROUND",
    size: 90,
    zone: "FLOOR",
    },
    
    {
    id: "clean_cable",
    label: "สายไฟเรียบร้อย",
    image: "/assets/safety-grid/Safe/clean-cable.png",
    type: "SAFE",
    spawn: "OBJECT",
    size: 82,
    zone: "EDGE",
    },
    
    {
    id: "emergency_shower",
    label: "ฝักบัวฉุกเฉินพร้อมใช้",
    image: "/assets/safety-grid/Safe/emergency-shower.png",
    type: "SAFE",
    spawn: "OBJECT",
    size: 92,
    zone: "WALL",
    },
    
    {
    id: "exit_door_ok",
    label: "ทางออกโล่ง",
    image: "/assets/safety-grid/Safe/Exit-door-ok.png",
    type: "SAFE",
    spawn: "OBJECT",
    size: 110,
    zone: "WALL",
    },
    
    {
    id: "fire_extinguisher",
    label: "ถังดับเพลิงพร้อมใช้",
    image: "/assets/safety-grid/Safe/fire-extinguisher.png",
    type: "SAFE",
    spawn: "OBJECT",
    size: 88,
    zone: "EDGE",
    },
    
    {
    id: "forklift_safety",
    label: "ขับโฟล์คลิฟท์ปลอดภัย",
    image: "/assets/safety-grid/Safe/Forklift-safety.png",
    type: "SAFE",
    spawn: "HUMAN",
    size: 118,
    zone: "CENTER",
    },
    
    {
    id: "ladder_safety",
    label: "ใช้บันไดถูกต้อง",
    image: "/assets/safety-grid/Safe/Ladder Safety.png",
    type: "SAFE",
    spawn: "HUMAN",
    size: 104,
    zone: "EDGE",
    },
    
    {
    id: "man_helmet",
    label: "ใส่ PPE ครบ",
    image: "/assets/safety-grid/Safe/Man Helmet.png",
    type: "SAFE",
    spawn: "HUMAN",
    size: 100,
    zone: "CENTER",
    },
    
    {
    id: "ppe_shelf",
    label: "ชั้น PPE",
    image: "/assets/safety-grid/Safe/PPE-shelf.png",
    type: "SAFE",
    spawn: "OBJECT",
    size: 92,
    zone: "WALL",
    },
    
    {
    id: "secure_barrel",
    label: "ถังเก็บปลอดภัย",
    image: "/assets/safety-grid/Safe/Secure-barrel.png",
    type: "SAFE",
    spawn: "OBJECT",
    size: 92,
    zone: "FLOOR",
    },
    
    {
    id: "worker_clipboard",
    label: "พนักงานตรวจเช็ก",
    image: "/assets/safety-grid/Safe/worker-checking-clipboard.png",
    type: "SAFE",
    spawn: "HUMAN",
    size: 102,
    zone: "CENTER",
    },
    
    // =========================
    // UNSAFE ACTION
    // =========================
    
    {
    id: "headphone",
    label: "ใส่หูฟังตอนทำงาน",
    image: "/assets/safety-grid/Unsafe Action/headphone.png",
    type: "UA",
    spawn: "HUMAN",
    size: 100,
    zone: "CENTER",
    },
    
    {
    id: "improper_lifting",
    label: "ยกของผิดท่า",
    image: "/assets/safety-grid/Unsafe Action/improper-lifting.png",
    type: "UA",
    spawn: "HUMAN",
    size: 110,
    collisionScale: 1.3,
    zone: "CENTER",
    },
    
    {
    id: "no_helmet",
    label: "ไม่ใส่หมวก",
    image: "/assets/safety-grid/Unsafe Action/No Helmet.png",
    type: "UA",
    spawn: "HUMAN",
    size: 100,
    zone: "CENTER",
    },
    
    {
    id: "phone_worker",
    label: "ใช้มือถือระหว่างทำงาน",
    image: "/assets/safety-grid/Unsafe Action/phone-worker.png",
    type: "UA",
    spawn: "HUMAN",
    size: 100,
    zone: "CENTER",
    },
    
    {
    id: "phone_worker2",
    label: "เดินใช้มือถือ",
    image: "/assets/safety-grid/Unsafe Action/phone-worker2.png",
    type: "UA",
    spawn: "HUMAN",
    size: 100,
    zone: "CENTER",
    },
    
    {
    id: "play_worker",
    label: "เล่นกันในพื้นที่ทำงาน",
    image: "/assets/safety-grid/Unsafe Action/play-worker.png",
    type: "UA",
    spawn: "HUMAN",
    size: 104,
    collisionScale: 1.4,
    zone: "CENTER",
    },
    
    {
    id: "play_worker2",
    label: "เล่นซิ่งในโรงงาน",
    image: "/assets/safety-grid/Unsafe Action/play-worker2.png",
    type: "UA",
    spawn: "HUMAN",
    size: 104,
    collisionScale: 1.4,
    zone: "CENTER",
    },
    
    {
    id: "running",
    label: "วิ่งในโรงงาน",
    image: "/assets/safety-grid/Unsafe Action/Running.png",
    type: "UA",
    spawn: "HUMAN",
    size: 112,
    zone: "CENTER",
    },
    
    {
    id: "sleeping",
    label: "หลับระหว่างงาน",
    image: "/assets/safety-grid/Unsafe Action/sleeping.png",
    type: "UA",
    spawn: "HUMAN",
    size: 108,
    zone: "CENTER",
    },
    
    {
    id: "smoke_man",
    label: "สูบบุหรี่",
    image: "/assets/safety-grid/Unsafe Action/smoke-man.png",
    type: "UA",
    spawn: "HUMAN",
    size: 102,
    zone: "EDGE",
    },
    
    {
    id: "wobbling_chair",
    label: "ยืนบนเก้าอี้",
    image: "/assets/safety-grid/Unsafe Action/wobbling-chair.png",
    type: "UA",
    spawn: "HUMAN",
    size: 110,
    zone: "EDGE",
    },
    
    {
    id: "worker_oncoffee",
    label: "ถือกาแฟตอนทำงาน",
    image: "/assets/safety-grid/Unsafe Action/worker-oncoffee.png",
    type: "UA",
    spawn: "HUMAN",
    size: 100,
    zone: "CENTER",
    },
    
    // =========================
    // UNSAFE CONDITION
    // =========================
    
    {
    id: "chemical_smoke",
    label: "ควันสารเคมี",
    image: "/assets/safety-grid/Unsafe Condition/chemical-smoke.png",
    type: "UC",
    spawn: "OBJECT",
    size: 100,
    zone: "EDGE",
    },
    
    {
    id: "cracked_floor",
    label: "พื้นแตก",
    image: "/assets/safety-grid/Unsafe Condition/cracked-floor.png",
    type: "UC",
    spawn: "GROUND",
    size: 96,
    zone: "FLOOR",
    },
    
    {
    id: "electric_wire",
    label: "สายไฟชำรุด",
    image: "/assets/safety-grid/Unsafe Condition/Electric wire spark.png",
    type: "UC",
    spawn: "OBJECT",
    size: 92,
    zone: "WALL",
    },
    
    {
    id: "exit_blocked",
    label: "ทางออกโดนบัง",
    image: "/assets/safety-grid/Unsafe Condition/exit-door-obs.png",
    type: "UC",
    spawn: "OBJECT",
    size: 116,
    zone: "WALL",
    },
    
    {
    id: "guardrail_broken",
    label: "ราวกันตกพัง",
    image: "/assets/safety-grid/Unsafe Condition/guardrail-broken.png",
    type: "UC",
    spawn: "OBJECT",
    size: 98,
    zone: "EDGE",
    },
    
    {
    id: "ladder_crack",
    label: "บันไดชำรุด",
    image: "/assets/safety-grid/Unsafe Condition/ladder-crack.png",
    type: "UC",
    spawn: "OBJECT",
    size: 98,
    zone: "EDGE",
    },
    
    {
    id: "leak_barrel",
    label: "สารเคมีรั่ว",
    image: "/assets/safety-grid/Unsafe Condition/leak-barrel.png",
    type: "UC",
    spawn: "OBJECT",
    size: 108,
    zone: "FLOOR",
    },
    
    {
    id: "light_broken",
    label: "ไฟเสีย",
    image: "/assets/safety-grid/Unsafe Condition/light-broken.png",
    type: "UC",
    spawn: "OBJECT",
    size: 88,
    zone: "WALL",
    },
    
    {
    id: "oil_spill",
    label: "น้ำมันหก",
    image: "/assets/safety-grid/Unsafe Condition/Oil Spilled.png",
    type: "UC",
    spawn: "GROUND",
    size: 94,
    zone: "FLOOR",
    },
    
    {
    id: "paddle",
    label: "แอ่งน้ำบนพื้น",
    image: "/assets/safety-grid/Unsafe Condition/paddle.png",
    type: "UC",
    spawn: "GROUND",
    size: 92,
    zone: "FLOOR",
    },
    
    {
    id: "unstable",
    label: "ของวางไม่มั่นคง",
    image: "/assets/safety-grid/Unsafe Condition/unstable.png",
    type: "UC",
    spawn: "OBJECT",
    size: 100,
    zone: "EDGE",
    },
    ];