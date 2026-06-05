import { useState, useCallback, useEffect } from 'react';
import type { Screen, GameResult, PlayerProfile } from './types';
import { getProfile, getProgress, unlockNextStage, clearProfile, saveProfile } from './storage';
import { initLiff, type LineIdentity } from './lib/liff';
import { fetchProfileByLineUserId } from './services/identityService';
import { recordStageClear, recordEndlessScore } from './services/leaderboardService';
import RegistrationScreen from './screens/RegistrationScreen';
import TitleScreen from './screens/TitleScreen';
import CampaignScreen from './screens/CampaignScreen';
import ResultScreen from './screens/ResultScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import Stage1SafetySwipe from './stages/Stage1SafetySwipe';
import Stage2PPERush from './stages/Stage2PPERush';
import Stage3AccidentInvestigate from './stages/Stage3AccidentInvestigate';
import EndlessMode from './stages/EndlessMode';
import MenuBgm from './components/MenuBgm';
import { savePlayer } from './lib/playerData';
type AppScreen = Screen | 'edit_profile';
const STAGE_UNLOCK_DATES: Record<number, string> = {
  2: '2026-06-08T08:00:00+07:00',
  3: '2026-06-11T08:00:00+07:00',
};
const [isPaused, setIsPaused] = useState(false);
const isStageOpenByDate = (stage: number) => {
  const unlockDate = STAGE_UNLOCK_DATES[stage];
  if (!unlockDate) return true;

  return new Date() >= new Date(unlockDate);
};
export default function App() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [lineIdentity, setLineIdentity] = useState<LineIdentity | null>(null);
  const [screen, setScreen] = useState<AppScreen>('register');
  const [result, setResult] = useState<GameResult | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [progress, setProgress] = useState(() => getProgress());
  const [liffReady, setLiffReady] = useState(false);

  // Initialise LIFF and resolve identity on mount
useEffect(() => {
  (async () => {
    try {
      const identity = await initLiff();

      console.log('[LIFF identity]', identity);

      setLineIdentity(identity);

      const savedPlayer = await savePlayer({
        line_user_id: identity.lineUserId,
        display_name: identity.displayName,
        picture_url: identity.pictureUrl ?? null,
      });

      console.log('[savePlayer result]', savedPlayer);

      const remoteProfile = identity.verified
        ? await fetchProfileByLineUserId(identity.lineUserId).catch((err) => {
            console.warn('[fetchProfileByLineUserId failed]', err);
            return null;
          })
        : null;
        if (identity.verified && !remoteProfile) {
  clearProfile();

  // ล้าง local save/progress ทุกตัวที่เป็นของเกมนี้
  Object.keys(localStorage).forEach((key) => {
    if (
      key.includes('factoryChaos') ||
      key.includes('profile') ||
      key.includes('progress') ||
      key.includes('stage') ||
      key.includes('unlock')
    ) {
      localStorage.removeItem(key);
    }
  });

  setProfile(null);
  setProgress(getProgress());
  setScreen('register');
  return;
}
        if (remoteProfile && isCompleteProfile(remoteProfile)) {
        const merged: PlayerProfile = {
          ...remoteProfile,
          ...identity,
          lineUserId: identity.lineUserId,
          displayName: identity.displayName,
          pictureUrl: identity.pictureUrl,
          profileLocked: true,
        };

        saveProfile(merged);
        setProfile(merged);
        setProgress(getProgress());
        setScreen('title');
        return;
      }

      const local = getProfile();

      if (!identity.verified && local && isCompleteProfile(local)) {
        const merged: PlayerProfile = {
          ...local,
          lineUserId: local.lineUserId ?? identity.lineUserId,
          displayName: local.displayName ?? identity.displayName,
          pictureUrl: local.pictureUrl ?? identity.pictureUrl,
          profileLocked: identity.verified ? true : local.profileLocked,
        };

        saveProfile(merged);
        setProfile(merged);
        setProgress(getProgress());
        setScreen('title');
        return;
      }

      setScreen('register');
    } catch (err) {
      console.error('[App init failed]', err);
      setScreen('register');
    } finally {
      setLiffReady(true);
    }
  })();
}, []);

  const refreshProgress = useCallback(() => setProgress(getProgress()), []);
  const isCompleteProfile = (p: PlayerProfile | null) =>
  !!p?.employeeId && !!p?.department;
  const handleRegistrationDone = useCallback(() => {
    const p = getProfile();
    setProfile(p);
    setProgress(getProgress());
    setScreen('title');
  }, []);

  const handleStageComplete = useCallback((score: number, stage: number) => {
    const passScore =
  stage === 1 ? 300 :
  stage === 2 ? 400 :
  stage === 3 ? 500 :
  0;
  
  const passed = score >= passScore;

if (passed) {
  unlockNextStage(stage);
      refreshProgress();
      const p = getProfile();

if (p) {
  recordStageClear(p, stage, score).catch((err) => {
    console.error('[StageClear] failed', { stage, score, err });
  });
} else {
  console.warn('[StageClear] no profile', { stage, score });
}
    }

    
    setResult({ score, stage, passed, passScore });
    setCurrentStage(stage);
    setScreen('result');
  }, [refreshProgress]);

  const handleEndlessComplete = useCallback((score: number, highScore: number) => {
    setResult({ score, stage: 'endless', passed: true, highScore });
    setScreen('result');
  
    const p = getProfile();
  
    if (p) {
      console.log('[EndlessComplete] saving', { profile: p, score, highScore });
  
      recordEndlessScore(p, score)
        .then(() => console.log('[EndlessComplete] saved'))
        .catch((err) => console.error('[EndlessComplete] failed', err));
    } else {
      console.warn('[EndlessComplete] no profile');
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (result?.stage === 'endless') {
      setScreen('endless');
      return;
    }
  
    if (typeof result?.stage === 'number') {
      // TEMP LOCK: กันกดเอาใหม่แล้วกลับเข้า Stage 2/3
      if (result.stage === 2 || result.stage === 3) {
        refreshProgress();
        setScreen('campaign');
        return;
      }
  
      setScreen(`stage${result.stage}` as Screen);
    }
  }, [result, refreshProgress]);

  const handleNext = useCallback(() => {
    if (typeof result?.stage === 'number') {
      const next = result.stage + 1;
  
      // TEMP LOCK: Stage 2 และ Stage 3 ยังไม่เปิด
      if (next === 2 || next === 3) {
        refreshProgress();
        setScreen('campaign');
        return;
      }
  
      setCurrentStage(next);
      setScreen(`stage${next}` as Screen);
    }
  }, [result, refreshProgress]);

  // Hidden dev reset: 5-tap on version text in TitleScreen
  const handleResetProfile = useCallback(() => {
    localStorage.clear();
    clearProfile();
    setProfile(null);
    setProgress(getProgress());
    setScreen('register');
    window.location.reload();
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800&family=Kanit:wght@400;600;700&family=Fredoka+One&family=Press+Start+2P&display=swap';
    document.head.appendChild(link);
  }, []);

  // Loading state while LIFF initialises
  if (!liffReady) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center overflow-hidden"
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          background:
            'radial-gradient(circle at top, #145b6b 0%, #071827 40%, #030712 100%)',
        }}
      >
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(45,170,190,0.18)', filter: 'blur(12px)' }}
        />
        <div
          className="absolute top-24 right-[-90px] w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.07)', filter: 'blur(14px)' }}
        />
  
        <div className="relative z-10 text-center px-6">
          <div
            className="font-game text-white font-bold leading-none mb-3"
            style={{
              fontSize: 'clamp(3rem, 14vw, 4.8rem)',
              textShadow:
                '0 5px 0 rgba(0,0,0,0.6), 0 0 26px rgba(45,170,190,0.5)',
            }}
          >
            TANIOBIS
          </div>
  
          <div
            className="font-game font-bold mb-6"
            style={{
              color: '#2DAABE',
              fontSize: 'clamp(1.4rem, 7vw, 2.2rem)',
              textShadow:
                '0 4px 0 rgba(0,0,0,0.65), 0 0 20px rgba(45,170,190,0.55)',
            }}
          >
            SAFETY GAME EVENT
          </div>
  
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  background: '#2DAABE',
                  animation: `loadingDot 0.9s ${i * 0.15}s infinite alternate`,
                }}
              />
            ))}
          </div>
  
          <div
            className="font-game text-white/85"
            style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}
          >
            กำลังโหลด...
          </div>
        </div>
  
        <style>{`
          @keyframes loadingDot {
            from { opacity: 0.35; transform: translateY(0); }
            to { opacity: 1; transform: translateY(-6px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ maxWidth: '430px', margin: '0 auto', background: '#0f172a' }}
    >
  
      {(screen === 'title' || screen === 'campaign') && (
        <MenuBgm />
      )}

      {/* NOTE: In production, profile editing should be disabled or protected
          by backend/admin validation to prevent impersonation.
          Edit profile is shown only when profileLocked is false (dev/non-LINE mode). */}
          {screen === 'register' && (
  <RegistrationScreen
    lineIdentity={lineIdentity}
    onDone={handleRegistrationDone}
  />
)}
      {screen === 'edit_profile' && profile && (
        <RegistrationScreen
          // Pass lineIdentity so RegistrationScreen can preserve lineUserId on save.
          // If lineIdentity is somehow null, fall back to the lineUserId already on
          // the profile so the Supabase record stays keyed on the correct identity.
          lineIdentity={
            lineIdentity ?? (profile.lineUserId
              ? { lineUserId: profile.lineUserId, displayName: profile.displayName ?? '', pictureUrl: profile.pictureUrl ?? '', verified: false }
              : null)
          }
          initialProfile={profile}
          onDone={() => {
            setProfile(getProfile());
            setScreen('title');
          }}
          onCancel={() => setScreen('title')}
        />
      )}

      {screen === 'title' && profile && (
        <TitleScreen
          profile={profile}
          progress={progress}
          onCampaign={() => setScreen('campaign')}
          onEndless={() => setScreen('title')}
          onLeaderboard={() => setScreen('leaderboard')}
          onEditProfile={() => setScreen('edit_profile')}
          onResetProfile={handleResetProfile}
        />
      )}

      {screen === 'campaign' && (
        <CampaignScreen
          progress={progress}
          onStage={(s) => {
            setCurrentStage(s);
            setScreen(`stage${s}` as Screen);
          }}
          onBack={() => setScreen('title')}
        />
      )}

      {screen === 'stage1' && (
        <Stage1SafetySwipe
          key={`s1-${currentStage}`}
          onComplete={(score) => handleStageComplete(score, 1)}
        />
      )}

      {screen === 'stage2' && (
        <Stage2PPERush
          key={`s2-${currentStage}`}
          onComplete={(score) => handleStageComplete(score, 2)}
        />
      )}

{screen === 'stage3' && (
  <Stage3AccidentInvestigate
    key={`s3-${currentStage}`}
    onExit={() => setScreen('campaign')}
    onClear={(score) => handleStageComplete(score, 3)}
  />
)}


{screen === 'endless' && profile && (
  <TitleScreen
    profile={profile}
    progress={progress}
    onCampaign={() => setScreen('campaign')}
    onEndless={() => setScreen('title')}
    onLeaderboard={() => setScreen('leaderboard')}
    onEditProfile={() => setScreen('edit_profile')}
    onResetProfile={handleResetProfile}
  />
)}

      {screen === 'result' && result && (
        <ResultScreen
          result={result}
          onRetry={handleRetry}
          onNext={handleNext}
          onHome={() => setScreen('title')}
        />
      )}

      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setScreen('title')} />
      )}
    </div>
    
  );
}
