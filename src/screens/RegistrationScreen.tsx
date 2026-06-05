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
    const empId = employeeId.trim();

if (!empId) {
  newErrors.employeeId = 'กรุณากรอกรหัสพนักงาน';
} else if (!/^\d{4}$/.test(empId)) {
  newErrors.employeeId = 'รหัสพนักงานต้องเป็นตัวเลข 4 หลักเท่านั้น';
}
    if (!department) newErrors.department = 'กรุณาเลือกแผนก';
    else if (!DEPARTMENTS.includes(department)) newErrors.department = 'กรุณาเลือกแผนกจากรายการ';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const profile: PlayerProfile = {
      employeeId: employeeId.trim(),
      department,
      createdAt: initialProfile?.createdAt ?? new Date().toISOString(),
      lineUserId: lineIdentity?.lineUserId,
      displayName: lineIdentity?.displayName,
      pictureUrl: lineIdentity?.pictureUrl,
      profileLocked: lineIdentity?.verified ?? false,
    };

    saveProfile(profile);

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
    <div
      className="flex flex-col h-full overflow-hidden relative"
      style={{
        background:
          'radial-gradient(circle at top, #145b6b 0%, #071827 40%, #030712 100%)',
      }}
    >
      {/* Soft background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full"
          style={{ background: 'rgba(45,170,190,0.18)', filter: 'blur(12px)' }}
        />
        <div
          className="absolute top-24 right-[-90px] w-64 h-64 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)', filter: 'blur(14px)' }}
        />
      </div>

      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 relative z-10 ${shake ? 'screen-shake' : ''}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {lineIdentity?.verified && (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 w-full max-w-sm border border-white/10"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {lineIdentity.pictureUrl ? (
              <img
                src={lineIdentity.pictureUrl}
                alt="LINE profile"
                className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex-shrink-0 bg-white/15 flex items-center justify-center text-xl">
                👤
              </div>
            )}
            <div className="min-w-0">
              <div className="font-game text-white font-bold text-sm truncate">
                {lineIdentity.displayName}
              </div>
              <div className="font-game text-white/60 text-xs">
                บัญชี LINE ของคุณ ✓
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-5">
          <h1
            className="font-game text-white text-center font-bold leading-tight"
            style={{
              fontSize: 'clamp(2rem, 8vw, 2.6rem)',
              textShadow: '0 4px 0 rgba(0,0,0,0.55), 0 0 20px rgba(45,170,190,0.45)',
            }}
          >
            {isEdit ? 'แก้ไขข้อมูล' : 'ลงทะเบียน'}
          </h1>
          <p
            className="font-game text-white/85 text-center mt-2 px-2"
            style={{ fontSize: 'clamp(0.95rem, 3.8vw, 1.1rem)' }}
          >
            {isEdit ? 'อัปเดตข้อมูลของคุณ' : 'กรอกข้อมูลก่อนเริ่มเล่น'}
          </p>
        </div>

        {!isEdit && (
          <div
            className="w-full max-w-sm rounded-2xl px-4 py-3 mb-5 flex items-start gap-3 border"
            style={{
              background: 'rgba(45,170,190,0.12)',
              borderColor: 'rgba(45,170,190,0.35)',
            }}
          >
            <span className="text-xl flex-shrink-0">!</span>
            <p className="font-game text-white text-sm leading-snug">
              ตรวจสอบรหัสพนักงานและแผนกให้ถูกต้องก่อนเริ่มเล่น
            </p>
          </div>
        )}

        <div
          className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5 border border-white/10"
          style={{
            background: 'rgba(255,255,255,0.96)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
          }}
        >
          <div>
            <label className="font-game text-slate-700 text-sm font-bold mb-2 block">
              รหัสพนักงาน
            </label>
            <input
  type="text"
  inputMode="numeric"
  maxLength={4}
  value={employeeId}
  onChange={e => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);

    setEmployeeId(value);
    setErrors(er => ({ ...er, employeeId: undefined }));
  }}
              placeholder="เช่น 1998"
              className="w-full rounded-2xl px-4 py-4 font-game text-slate-800 outline-none transition-all"
              style={{
                background: errors.employeeId ? 'rgba(239,68,68,0.08)' : 'rgba(15,23,42,0.06)',
                border: errors.employeeId ? '2px solid #ef4444' : '2px solid rgba(15,23,42,0.08)',
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              }}
            />
            {errors.employeeId && (
              <p className="font-game text-red-500 text-sm mt-1">
                {errors.employeeId}
              </p>
            )}
          </div>

          <div>
            <label className="font-game text-slate-700 text-sm font-bold mb-2 block">
              แผนก
            </label>
            <button
              onClick={() => setShowSheet(true)}
              className="w-full rounded-2xl px-4 py-4 text-left active:scale-95 transition-transform flex items-center justify-between"
              style={{
                background: errors.department ? 'rgba(239,68,68,0.08)' : 'rgba(15,23,42,0.06)',
                border: errors.department ? '2px solid #ef4444' : '2px solid rgba(15,23,42,0.08)',
              }}
            >
              <span
                className="font-game"
                style={{
                  color: department ? '#0f172a' : '#64748b',
                  fontSize: 'clamp(0.9rem, 3.6vw, 1.08rem)',
                }}
              >
                {department || 'เลือกแผนก...'}
              </span>
              <span className="text-slate-500 text-xl">▾</span>
            </button>
            {errors.department && (
              <p className="font-game text-red-500 text-sm mt-1">
                {errors.department}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 w-full max-w-sm py-5 rounded-2xl font-game text-white font-bold active:scale-95 transition-transform"
          style={{
            fontSize: 'clamp(1.25rem, 5vw, 1.55rem)',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            boxShadow: '0 7px 0 #14532d, 0 12px 20px rgba(0,0,0,0.38)',
          }}
        >
          {isEdit ? 'บันทึก' : 'เริ่มเล่น'}
        </button>

        {isEdit && onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 font-game text-white/70 text-base active:text-white transition-colors"
          >
            ยกเลิก
          </button>
        )}
      </div>

      {showSheet && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/65" onClick={() => setShowSheet(false)} />
          <div
            className="relative z-10 rounded-t-3xl flex flex-col overflow-hidden bounce-in border-t border-white/10"
            style={{
              background: '#071827',
              maxHeight: '75vh',
              boxShadow: '0 -12px 30px rgba(0,0,0,0.45)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pt-2 pb-3 flex-shrink-0">
              <div className="font-game text-white text-xl font-bold mb-3">
                เลือกแผนก
              </div>
              <div
                className="flex items-center rounded-2xl px-4 py-3 gap-3 border border-white/10"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <span className="text-white/50 text-lg">ค้นหา</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="พิมพ์เพื่อค้นหา..."
                  className="flex-1 bg-transparent font-game text-white placeholder-white/40 outline-none text-base"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-white/40 text-lg">
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ scrollbarWidth: 'none' }}>
              {filtered.length === 0 ? (
                <div className="text-center py-8 font-game text-white/40">
                  ไม่พบแผนก
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map((dept, i) => (
                    <button
                      key={dept}
                      onClick={() => handleSelectDept(dept)}
                      className="w-full text-left rounded-2xl px-4 py-4 active:scale-95 transition-all"
                      style={{
                        background:
                          department === dept
                            ? 'linear-gradient(135deg, #2DAABE, #176f7e)'
                            : 'rgba(255,255,255,0.07)',
                        border:
                          department === dept
                            ? '1px solid rgba(45,170,190,0.8)'
                            : '1px solid rgba(255,255,255,0.08)',
                        animationDelay: `${i * 0.03}s`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="font-game font-bold"
                          style={{
                            color: 'white',
                            fontSize: 'clamp(0.9rem, 3.6vw, 1.05rem)',
                          }}
                        >
                          {dept}
                        </span>
                        {department === dept && <span className="text-white text-xl">✓</span>}
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