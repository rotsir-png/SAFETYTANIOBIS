import type { SwipeCard, PPEItem, LeaderboardEntry, DeptParticipation } from './types';

export const DEPARTMENTS = [
  'CAP Technology Center',
  'Chemical Plant',
  'Executive Office',
  'Financial Controlling & Information Management',
  'HSEQ',
  'Human Resources & General Administration',
  'Materials Management and Sales',
  'Metallurgical Plant',
  'Plant Engineering & Maintenance',
  'Technical Development',
];

export const swipeCards: SwipeCard[] = [
    { id: 1, label: 'หมวกอยู่บนหัว แต่ยังไม่คาดสายรัดคาง', emoji: '⛑️', isSafe: false },
    { id: 2, label: 'ใช้คัตเตอร์ทั่วไปแทน Safety Cutter', emoji: '🔪', isSafe: false },
    { id: 3, label: 'สายไฟพาดทางเดิน แต่คนยังเดินข้ามได้อยู่', emoji: '🔌', isSafe: false },
    { id: 4, label: 'โฟล์คลิฟท์กำลังถอย คนขับก้มดูมือถือ', emoji: '📱', isSafe: false },
    { id: 5, label: 'ของเริ่มล้ำหน้าถังดับเพลิง แต่ยังหยิบได้อยู่', emoji: '📦', isSafe: false },
    { id: 6, label: 'น้ำหกแล้วมีคนรีบเช็ดก่อนจะมีคนเดินผ่านมา', emoji: '💧', isSafe: true },
    { id: 7, label: 'ของอยู่สูงแค่นิดเดียว เลยเหยียบเก้าอี้มีล้อหยิบของ', emoji: '🪑', isSafe: false },
    { id: 8, label: 'pressure ยังไม่ลง แต่เริ่มคลายน็อตแล้ว', emoji: '🔩', isSafe: false },
    { id: 9, label: 'ติดป้ายกั้นพื้นที่ ขณะผู้รับเหมาทำงาน', emoji: '⚠️', isSafe: true },
    { id: 10, label: 'หยุดรอให้โฟล์คลิฟท์ผ่านก่อนข้ามทาง', emoji: '🚜', isSafe: true },
    { id: 11, label: 'รีบยกของพร้อมกัน จนไม่มีใครมองทาง', emoji: '🏋️', isSafe: false },
    { id: 12, label: 'เครื่องเสียงแปลก เลยหยุดเช็กก่อน', emoji: '🔧', isSafe: true },
    { id: 13, label: 'รีบยกลังคนเดียว เพราะไม่มีคนช่วยพอดี', emoji: '📦', isSafe: false },
    { id: 14, label: 'แก๊สยังไม่วัด แต่คนข้างในบอก “เข้าแป๊บเดียว”', emoji: '🫧', isSafe: false },
    { id: 15, label: 'เริ่มเชื่อมแล้ว แต่ Work Permit ยังไม่มา', emoji: '🔥', isSafe: false },
    { id: 16, label: 'โฟล์คลิฟท์หยุดรอคนเดินผ่าน', emoji: '🚜', isSafe: true },
    { id: 17, label: 'รอ pressure ลงก่อน ถึงเริ่มแกะหน้าแปลน', emoji: '🔩', isSafe: true },
    { id: 18, label: 'หยุดงานก่อน เพื่อเช็กเสียงเครื่องแปลก', emoji: '🛑', isSafe: true },
    { id: 19, label: 'กล่องเริ่มล้ำทางเดิน แต่รถยังผ่านได้อยู่', emoji: '📦', isSafe: false },
    { id: 20, label: 'เสียเวลาย้ายของ เพื่อเปิดทางถังดับเพลิง', emoji: '🧯', isSafe: true },
    { id: 21, label: 'หยุดโฟล์คลิฟท์ให้คนเดินผ่านก่อน', emoji: '🚧', isSafe: true },
    { id: 22, label: 'สายไฟเริ่มแตก แต่เครื่องยังใช้งานได้อยู่', emoji: '🔌', isSafe: false },
    { id: 23, label: 'น้ำมันหกนิดเดียว คนเลยเดินอ้อมกันเอง', emoji: '🛢️', isSafe: false },
    { id: 24, label: 'รีบแก้งาน เลยไม่ล็อกเครื่องก่อนซ่อม', emoji: '🔒', isSafe: false },
    { id: 25, label: 'พาเลทเริ่มโยก แต่ยังมีคนยืนหยิบของอยู่', emoji: '📦', isSafe: false },
    { id: 26, label: 'เครนเริ่มแกว่ง แต่ด้านล่างยังมีคนเดินผ่าน', emoji: '🏗️', isSafe: false },
    { id: 27, label: 'ถังเคมีเต็มแล้ว เลยเริ่มวางข้างเครื่องแทน', emoji: '🧪', isSafe: false },
    { id: 28, label: 'รีบตัดพลาสติก จนปาดคัตเตอร์เข้าหาตัว', emoji: '🔪', isSafe: false },
    { id: 29, label: 'กระเช้าสะบัด หลังเผลอไปโดนปุ่มเครน', emoji: '🏗️', isSafe: false },
    { id: 30, label: 'เครื่องยังเดินได้ เลยยังไม่มีใครแจ้งซ่อม', emoji: '⚙️', isSafe: false },
    { id: 31, label: 'รอเปลี่ยนใบมีดคัตเตอร์ก่อนเริ่มตัดงานต่อ', emoji: '🔪', isSafe: true },
    { id: 32, label: 'เห็นน็อตตกพื้น เลยรีบเก็บออกจากทางเดิน', emoji: '🔩', isSafe: true },
    { id: 33, label: 'รอสัญญาณจากคนคุมเครนก่อนยกของ', emoji: '🏗️', isSafe: true },
    { id: 34, label: 'หยุดเดิน รอรถโฟล์คลิฟท์ผ่านก่อน', emoji: '🚜', isSafe: true },
    { id: 35, label: 'ย้ายสายไฟออกจากทางเดิน ก่อนเริ่มงานต่อ', emoji: '🔌', isSafe: true },
    { id: 36, label: 'รีบส่งงาน เลยวางเครื่องมือคาไว้บนเครื่องจักร', emoji: '🛠️', isSafe: false },
    { id: 37, label: 'ปุ่ม Emergency Stop ถูกวางของบังไว้บางส่วน', emoji: '🛑', isSafe: false },
    { id: 38, label: 'รีบข้ามพื้นที่กั้น เพราะอีกฝั่งใกล้กว่า', emoji: '🚧', isSafe: false },
    { id: 39, label: 'พื้นเริ่มลื่น แต่ยังไม่มีใครล้ม', emoji: '💧', isSafe: false },
    { id: 40, label: 'หยุดงานชั่วคราว เพื่อรอค่าแก๊สยืนยัน', emoji: '🫧', isSafe: true },
    { id: 41, label: 'รีบขึ้นนั่งร้านก่อนตรวจสภาพ', emoji: '🪜', isSafe: false },
    { id: 42, label: 'ยอมเสียเวลา เพื่อทำ Safety Review ให้ครบ', emoji: '📋', isSafe: true },
  { id: 43, label: 'ทีมงานรอ Safety Review ก่อนเข้าพื้นที่', emoji: '📋', isSafe: true },
  { id: 44, label: 'หยุดเปิดงาน เพราะ Safety Review ยังไม่ครบ', emoji: '⚠️', isSafe: true },
  { id: 45, label: 'รอ Safety Review จบก่อนเริ่มงาน', emoji: '📋', isSafe: true },
  { id: 46, label: 'เลื่อนเริ่มงาน เพื่อรอ Safety Review ยืนยัน', emoji: '📄', isSafe: true },
  ];

export const ppeItems: PPEItem[] = [
  { id: 1, emoji: '🪖', label: 'หมวก', isCorrect: true },
  { id: 2, emoji: '🥽', label: 'แว่นตา', isCorrect: true },
  { id: 3, emoji: '🧤', label: 'ถุงมือ', isCorrect: true },
  { id: 4, emoji: '👞', label: 'รองเท้าเซฟตี้', isCorrect: true },
  { id: 5, emoji: '😷', label: 'หน้ากาก', isCorrect: true },
  { id: 6, emoji: '🦺', label: 'เสื้อสะท้อนแสง', isCorrect: true },
  { id: 7, emoji: '🎧', label: 'ที่อุดหู', isCorrect: true },
  { id: 8, emoji: '🛡️', label: 'กระบังหน้า', isCorrect: true },
  { id: 9, emoji: '🍜', label: 'มาม่า', isCorrect: false },
  { id: 10, emoji: '📱', label: 'มือถือ', isCorrect: false },
  { id: 11, emoji: '🧋', label: 'ชานม', isCorrect: false },
  { id: 12, emoji: '🎮', label: 'จอยเกม', isCorrect: false },
  { id: 13, emoji: '🐱', label: 'แมว', isCorrect: false },
  { id: 14, emoji: '🍌', label: 'กล้วย', isCorrect: false },
  { id: 15, emoji: '🧸', label: 'ตุ๊กตา', isCorrect: false },
  { id: 16, emoji: '🩴', label: 'รองเท้าแตะ', isCorrect: false },
];

export const hazardItems = [
  { emoji: '🔥', label: 'ไฟไหม้', isHazard: true },
  { emoji: '⚡', label: 'ไฟฟ้ารั่ว', isHazard: true },
  { emoji: '🧪', label: 'สารเคมี', isHazard: true },
  { emoji: '💧', label: 'พื้นลื่น', isHazard: true },
  { emoji: '🕳️', label: 'หลุม', isHazard: true },
  { emoji: '🔪', label: 'ของมีคม', isHazard: true },
  { emoji: '🏗️', label: 'ของตก', isHazard: true },
  { emoji: '🚧', label: 'ทางกีดขวาง', isHazard: true },
  { emoji: '🧱', label: 'ของวางเกะกะ', isHazard: true },
  { emoji: '🧯', label: 'ถังดับเพลิงถูกบัง', isHazard: true },
  // PPE decoys
  { emoji: '🪖', label: 'หมวก', isHazard: false },
  { emoji: '🥽', label: 'แว่นตา', isHazard: false },
  { emoji: '🧤', label: 'ถุงมือ', isHazard: false },
  { emoji: '👞', label: 'รองเท้าเซฟตี้', isHazard: false },
  { emoji: '😷', label: 'หน้ากาก', isHazard: false },
  { emoji: '🦺', label: 'เสื้อสะท้อนแสง', isHazard: false },
];

export const mockEndlessLeaderboard: LeaderboardEntry[] = [
  { rank: 1, employeeId: 'EMP0142', dept: 'Metallurgical Plant', score: 3250, survivedSeconds: 92 },
  { rank: 2, employeeId: 'EMP0088', dept: 'Plant Engineering & Maintenance', score: 2980, survivedSeconds: 85 },
  { rank: 3, employeeId: 'EMP0211', dept: 'HSEQ', score: 2740, survivedSeconds: 77 },
  { rank: 4, employeeId: 'EMP0055', dept: 'Chemical Plant', score: 2510, survivedSeconds: 71 },
  { rank: 5, employeeId: 'EMP0301', dept: 'Technical Development', score: 2280, survivedSeconds: 64 },
  { rank: 6, employeeId: 'EMP0177', dept: 'Materials Management and Sales', score: 2100, survivedSeconds: 59 },
  { rank: 7, employeeId: 'EMP0099', dept: 'CAP Technology Center', score: 1890, survivedSeconds: 53 },
  { rank: 8, employeeId: 'EMP0412', dept: 'Human Resources & General Administration', score: 1650, survivedSeconds: 46 },
  { rank: 9, employeeId: 'EMP0033', dept: 'Financial Controlling & Information Management', score: 1420, survivedSeconds: 40 },
  { rank: 10, employeeId: 'EMP0256', dept: 'Executive Office', score: 1200, survivedSeconds: 34 },
];

export const mockDeptParticipation: DeptParticipation[] = [
  { dept: 'Metallurgical Plant', participants: 85, totalEmployees: 100 },
  { dept: 'HSEQ', participants: 12, totalEmployees: 15 },
  { dept: 'Chemical Plant', participants: 42, totalEmployees: 60 },
  { dept: 'Plant Engineering & Maintenance', participants: 28, totalEmployees: 40 },
  { dept: 'Materials Management and Sales', participants: 35, totalEmployees: 50 },
  { dept: 'Technical Development', participants: 18, totalEmployees: 25 },
  { dept: 'CAP Technology Center', participants: 22, totalEmployees: 35 },
  { dept: 'Human Resources & General Administration', participants: 30, totalEmployees: 45 },
  { dept: 'Financial Controlling & Information Management', participants: 15, totalEmployees: 20 },
  { dept: 'Executive Office', participants: 8, totalEmployees: 12 },
];

// ── Stage 4: Safe or Die ──────────────────────────────────────────────────────

export interface SafeOrDieScenario {
  id: number;
  label: string;
  emoji: string;
  isSafe: boolean;
}

export const safeOrDieScenarios: SafeOrDieScenario[] = [
  { id: 1,  label: 'สวมหมวกก่อนเข้าโรงงาน',          emoji: '⛑️',  isSafe: true  },
  { id: 2,  label: 'ใช้มือหยุดเครื่องจักรที่หมุน',    emoji: '⚙️',  isSafe: false },
  { id: 3,  label: 'ล็อกวาล์วก่อนซ่อมท่อ',            emoji: '🔒',  isSafe: true  },
  { id: 4,  label: 'ยกของหนักโดยงอหลัง',              emoji: '🏋️', isSafe: false },
  { id: 5,  label: 'สวมแว่นตาก่อนตัดโลหะ',            emoji: '🥽',  isSafe: true  },
  { id: 6,  label: 'เปิดถังเคมีโดยไม่มีถุงมือ',        emoji: '🧪',  isSafe: false },
  { id: 7,  label: 'รายงานน้ำมันหกทันที',              emoji: '🛢️',  isSafe: true  },
  { id: 8,  label: 'วิ่งถือกรรไกรในโรงงาน',           emoji: '✂️',  isSafe: false },
  { id: 9,  label: 'สวมถุงมือก่อนแตะสารเคมี',          emoji: '🧤',  isSafe: true  },
  { id: 10, label: 'นั่งหลังรถโฟล์คลิฟท์',            emoji: '🚜',  isSafe: false },
  { id: 11, label: 'ตรวจสายไฟก่อนเปิดเครื่อง',        emoji: '🔌',  isSafe: true  },
  { id: 12, label: 'ทานข้าวข้างเครื่องจักร',           emoji: '🍱',  isSafe: false },
  { id: 13, label: 'ใส่อุปกรณ์ดับเพลิงตามจุด',        emoji: '🧯',  isSafe: true  },
  { id: 14, label: 'เล่นโทรศัพท์ขณะทำงานบนที่สูง',   emoji: '📱',  isSafe: false },
  { id: 15, label: 'ติดป้ายเตือนก่อนซ่อมไฟฟ้า',      emoji: '⚠️',  isSafe: true  },
  { id: 16, label: 'โยนอุปกรณ์ให้เพื่อนจากที่สูง',   emoji: '🪜',  isSafe: false },
  { id: 17, label: 'สวมหน้ากากขณะพ่นสารเคมี',         emoji: '😷',  isSafe: true  },
  { id: 18, label: 'ซ่อมแซมไฟฟ้าขณะยังเปิดอยู่',     emoji: '⚡',  isSafe: false },
  { id: 19, label: 'ใช้บันไดที่ได้มาตรฐาน',           emoji: '🪜',  isSafe: true  },
  { id: 20, label: 'ปิดทางออกฉุกเฉินด้วยกล่อง',       emoji: '📦',  isSafe: false },
];

// ── Stage 5: Boss is Coming ───────────────────────────────────────────────────

export interface BossHazard {
  id: number;
  emoji: string;
  label: string;
}

export const bossHazards: BossHazard[] = [
  { id: 1,  emoji: '🔥', label: 'ไฟ!' },
  { id: 2,  emoji: '💧', label: 'พื้นลื่น' },
  { id: 3,  emoji: '📦', label: 'ทางโล่งถูกบัง' },
  { id: 4,  emoji: '🧪', label: 'สารเคมีหก' },
  { id: 5,  emoji: '⚡', label: 'ไฟฟ้ารั่ว' },
  { id: 6,  emoji: '🔪', label: 'ของมีคม' },
  { id: 7,  emoji: '🕳️', label: 'หลุมอันตราย' },
  { id: 8,  emoji: '🧱', label: 'สิ่งกีดขวาง' },
  { id: 9,  emoji: '🛢️', label: 'ถังรั่ว' },
  { id: 10, emoji: '🏗️', label: 'ของห้อยสูง' },
];

// ── Stage 6: Safe Stack ───────────────────────────────────────────────────────

export interface StackItem {
  id: number;
  emoji: string;
  label: string;
  isSafe: boolean;
}

export const stackItems: StackItem[] = [
  { id: 1,  emoji: '⛑️', label: 'หมวกนิรภัย',     isSafe: true  },
  { id: 2,  emoji: '🥽', label: 'แว่นตา',          isSafe: true  },
  { id: 3,  emoji: '🧤', label: 'ถุงมือ',           isSafe: true  },
  { id: 4,  emoji: '😷', label: 'หน้ากาก',          isSafe: true  },
  { id: 5,  emoji: '🦺', label: 'เสื้อสะท้อนแสง',  isSafe: true  },
  { id: 6,  emoji: '👞', label: 'รองเท้าเซฟตี้',   isSafe: true  },
  { id: 7,  emoji: '🛡️', label: 'กระบังหน้า',      isSafe: true  },
  { id: 8,  emoji: '🎧', label: 'ที่อุดหู',          isSafe: true  },
  { id: 9,  emoji: '🍜', label: 'มาม่า',            isSafe: false },
  { id: 10, emoji: '📱', label: 'มือถือ',           isSafe: false },
  { id: 11, emoji: '🐱', label: 'แมว',              isSafe: false },
  { id: 12, emoji: '🎮', label: 'จอยเกม',           isSafe: false },
  { id: 13, emoji: '🍌', label: 'กล้วย',            isSafe: false },
  { id: 14, emoji: '🧸', label: 'ตุ๊กตา',           isSafe: false },
  { id: 15, emoji: '🩴', label: 'รองเท้าแตะ',      isSafe: false },
  { id: 16, emoji: '🧋', label: 'ชานม',             isSafe: false },
];

// ── Stage 7: 5-Second Inspect ─────────────────────────────────────────────────

export interface InspectScene {
  id: number;
  label: string;
  desc: string;
  hazardEmoji: string;
  decoys: string[];
}

export const inspectScenes: InspectScene[] = [
  { id: 1,  label: 'สายไฟขาด',          desc: 'ห้องควบคุม',   hazardEmoji: '⚡', decoys: ['🔌','🖥️','📋'] },
  { id: 2,  label: 'น้ำมันหก',           desc: 'พื้นโรงงาน',   hazardEmoji: '🛢️', decoys: ['🧰','🔧','⚙️'] },
  { id: 3,  label: 'ไฟไหม้',            desc: 'คลังสินค้า',   hazardEmoji: '🔥', decoys: ['📦','🧯','🚪'] },
  { id: 4,  label: 'ถังเคมีรั่ว',        desc: 'ห้องเก็บสาร',  hazardEmoji: '🧪', decoys: ['🪣','🧹','📋'] },
  { id: 5,  label: 'ชั้นวางพัง',         desc: 'คลังอุปกรณ์',  hazardEmoji: '🏗️', decoys: ['📦','🗄️','🧱'] },
  { id: 6,  label: 'ทางออกฉุกเฉินถูกบัง', desc: 'ทางเดิน',    hazardEmoji: '🚪', decoys: ['📦','🧱','🪜'] },
  { id: 7,  label: 'ท่อแก๊สรั่ว',        desc: 'ห้องเครื่อง',  hazardEmoji: '💨', decoys: ['🔧','⚙️','🔩'] },
  { id: 8,  label: 'สายพาน ไม่มีการ์ด', desc: 'ไลน์ผลิต',    hazardEmoji: '⚙️', decoys: ['🪖','🔩','🏭'] },
  { id: 9,  label: 'พื้นลื่น',           desc: 'ห้องน้ำโรงงาน', hazardEmoji: '💧', decoys: ['🧼','🚿','🚽'] },
  { id: 10, label: 'สายยกของบิด',        desc: 'โกดัง',        hazardEmoji: '⛓️', decoys: ['🏗️','📦','🧲'] },
];

export const STAGE_PASS_SCORE = 500;
export const GAME_DURATION = 60;
export const POINTS_CORRECT = 30;
export const POINTS_WRONG = -10;
