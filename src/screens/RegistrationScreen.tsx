import { useState, useRef, useEffect } from 'react';
import { DEPARTMENTS } from '../gameData';
import { saveProfile } from '../storage';
import { savePlayer } from '../lib/playerData';
import type { LineIdentity } from '../lib/liff';
import type { PlayerProfile } from '../types';

interface Props {
  lineIdentity: LineIdentity | null;
  initialProfile?: PlayerProfile | null;
  onDone: () => void;
  onCancel?: () => void;
}

export default function RegistrationScreen({ lineIdentity, initialProfile, onDone, onCancel }: Props) {
  const [employeeId, setEmployeeId] = useState(initialProfile?.employeeId ?? '');
  const [department, setDepartment] = useState(initialProfile?.department ?? '');
  const [showSheet, setShowSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [shake, setShake] = useState(false);
  const [errors, setErrors] = useState<{ employeeId?: string; department?: string }>({});
  const [visible, setVisible] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initialProfile;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showSheet) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 200);
    }
  }, [showSheet]);

  const filtered = DEPARTMENTS.filter(d =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectDept = (dept: string) => {
    setDepartment(dept);
    setErrors(e => ({ ...e, department: undefined }));
    setShowSheet(false);
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!employeeId.trim()) newErrors.employeeId = 'กรุณากรอกรหัสพนักงาน';
    if (!department) newErrors.department = 'กรุณาเลือกแผนก';
    else if (!DEPARTMENTS.includes(department)) newErrors.department = 'กรุณาเลือกแผนกจากรายการ';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // NOTE: employeeId is self-reported. lineUserId (from LINE LIFF) is verified
    // by LINE's OAuth but still requires backend HR lookup to fully confirm
    // the employeeId matches the LINE account. This is an MVP only.
    const profile: PlayerProfile = {
      employeeId:    employeeId.trim(),
      department,
      createdAt:     initialProfile?.createdAt ?? new Date().toISOString(),
      lineUserId:    lineIdentity?.lineUserId,
      displayName:   lineIdentity?.displayName,
      pictureUrl:    lineIdentity?.pictureUrl,
      // Lock profile when identity is LINE-verified to prevent impersonation
      profileLocked: lineIdentity?.verified ?? false,
    };

    saveProfile(profile);

    // Write registered player data to Supabase
    await savePlayer({
      line_user_id: profile.lineUserId ?? `local_${profile.employeeId}`,
      display_name: profile.displayName ?? profile.employeeId,
      picture_url: profile.pictureUrl,
      employee_id: profile.employeeId,
      department: profile.department,
    });
    
    onDone();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-orange-500 via-amber-500 to-yellow-400 overflow-hidden relative">
      {/* Decorative bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🏭','⚙️','🔧','⛑️','🦺','🔥','🧤','📋'].map((e, i) => (
          <div
            key={i}
            className="absolute text-5xl opacity-10"
            style={{
              left: `${(i * 13 + 5) % 90}%`,
              top: `${(i * 19 + 8) % 85}%`,
              transform: `rotate(${i * 45}deg)`,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 relative z-10 ${shake ? 'screen-shake' : ''}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* LINE identity badge (if verified) */}
        {lineIdentity?.verified && (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 w-full max-w-sm"
            style={{ background: 'rgba(0,0,0,0.18)' }}
          >
            {lineIdentity.pictureUrl ? (
              <img
                src={lineIdentity.pictureUrl}
                alt="LINE profile"
                className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex-shrink-0 bg-white/20 flex items-center justify-center text-xl">👤</div>
            )}
            <div className="min-w-0">
              <div className="font-game text-white font-bold text-sm truncate">{lineIdentity.displayName}</div>
              <div className="font-game text-white/60 text-xs">บัญชี LINE ของคุณ ✓</div>
            </div>
          </div>
        )}

        <div className="text-5xl mb-3">🏭</div>
        <h1
          className="font-game text-white text-center font-bold mb-1"
          style={{ fontSize: 'clamp(1.4rem, 6vw, 1.8rem)', textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}
        >
          {isEdit ? 'แก้ไขข้อมูล' : 'ลงทะเบียนก่อนเริ่มเล่น'}
        </h1>
        <p className="font-game text-white/80 text-center text-sm mb-4 px-2">
          {isEdit ? 'อัปเดตข้อมูลของคุณ' : 'กรอกข้อมูลให้ถูกต้อง จะแก้ไขไม่ได้ภายหลัง'}
        </p>

        {!isEdit && (
          <div
            className="w-full max-w-sm rounded-2xl px-4 py-3 mb-5 flex items-start gap-3"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1.5px solid rgba(255,255,255,0.3)' }}
          >
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="font-game text-white text-sm leading-snug">
              ตรวจสอบให้ถูกต้อง ข้อมูลนี้จะแก้ไขไม่ได้หลังเริ่มเล่น
            </p>
          </div>
        )}

        {/* Form card */}
        <div
          className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
          style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        >
          <div>
            <label className="font-game text-slate-700 text-sm font-bold mb-2 block">รหัสพนักงาน</label>
            <input
              type="text"
              value={employeeId}
              onChange={e => {
                setEmployeeId(e.target.value);
                setErrors(er => ({ ...er, employeeId: undefined }));
              }}
              placeholder="เช่น EMP001"
              className="w-full rounded-2xl px-4 py-4 font-game text-slate-800 outline-none transition-all"
              style={{
                background: errors.employeeId ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.05)',
                border: errors.employeeId ? '2px solid #ef4444' : '2px solid transparent',
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              }}
            />
            {errors.employeeId && (
              <p className="font-game text-red-500 text-sm mt-1">{errors.employeeId}</p>
            )}
          </div>

          <div>
            <label className="font-game text-slate-700 text-sm font-bold mb-2 block">แผนก</label>
            <button
              onClick={() => setShowSheet(true)}
              className="w-full rounded-2xl px-4 py-4 text-left active:scale-98 transition-transform flex items-center justify-between"
              style={{
                background: errors.department ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.05)',
                border: errors.department ? '2px solid #ef4444' : '2px solid transparent',
              }}
            >
              <span
                className="font-game"
                style={{
                  color: department ? '#1e293b' : '#94a3b8',
                  fontSize: 'clamp(0.85rem, 3.5vw, 1.05rem)',
                }}
              >
                {department || 'เลือกแผนก...'}
              </span>
              <span className="text-slate-400 text-xl">▾</span>
            </button>
            {errors.department && (
              <p className="font-game text-red-500 text-sm mt-1">{errors.department}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 w-full max-w-sm py-5 rounded-2xl font-game text-white font-bold active:scale-95 transition-transform"
          style={{
            fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            boxShadow: '0 6px 0 #14532d, 0 8px 20px rgba(0,0,0,0.3)',
          }}
        >
          {isEdit ? '💾 บันทึก' : '🚀 เริ่มป่วน!'}
        </button>

        {isEdit && onCancel && (
          <button
            onClick={onCancel}
            className="mt-3 font-game text-white/70 text-base active:text-white transition-colors"
          >
            ยกเลิก
          </button>
        )}
      </div>

      {/* Department bottom sheet */}
      {showSheet && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSheet(false)} />
          <div
            className="relative z-10 rounded-t-3xl flex flex-col overflow-hidden bounce-in"
            style={{ background: '#1e293b', maxHeight: '75vh' }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>
            <div className="px-5 pt-2 pb-3 flex-shrink-0">
              <div className="font-game text-white text-xl font-bold mb-3">เลือกแผนก</div>
              <div
                className="flex items-center rounded-2xl px-4 py-3 gap-3"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <span className="text-white/50 text-lg">🔍</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="พิมพ์เพื่อค้นหา..."
                  className="flex-1 bg-transparent font-game text-white placeholder-white/40 outline-none text-base"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-white/40 text-lg">✕</button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ scrollbarWidth: 'none' }}>
              {filtered.length === 0 ? (
                <div className="text-center py-8 font-game text-white/40">ไม่พบแผนก</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map((dept, i) => (
                    <button
                      key={dept}
                      onClick={() => handleSelectDept(dept)}
                      className="w-full text-left rounded-2xl px-4 py-4 active:scale-95 transition-all"
                      style={{
                        background: department === dept
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'rgba(255,255,255,0.07)',
                        border: department === dept ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        animationDelay: `${i * 0.03}s`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="font-game font-bold"
                          style={{
                            color: department === dept ? '#1c1917' : 'white',
                            fontSize: 'clamp(0.85rem, 3.5vw, 1rem)',
                          }}
                        >
                          {dept}
                        </span>
                        {department === dept && <span className="text-slate-800 text-xl">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
