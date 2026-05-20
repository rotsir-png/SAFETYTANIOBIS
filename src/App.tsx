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
import Stage3TapHazard from './stages/Stage3TapHazard';
import Stage4ClawMachine from './stages/Stage4ClawMachine';
import Stage5HazardDefense from './stages/Stage5HazardDefense';
import Stage6MachineSync from './stages/Stage6MachineSync';
import Stage7ForklifPanic from './stages/Stage7ForklifPanic';
import Stage8FinalChaos from './stages/Stage8FinalChaos';
import EndlessMode from './stages/EndlessMode';
import MenuBgm from './components/MenuBgm';
import { savePlayer } from './lib/playerData';
type AppScreen = Screen | 'edit_profile';
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

      if (remoteProfile) {
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

      if (local) {
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

  const handleRegistrationDone = useCallback(() => {
    const p = getProfile();
    setProfile(p);
    setProgress(getProgress());
    setScreen('title');
  }, []);

  const handleStageComplete = useCallback((score: number, stage: number) => {
    const passScore =
      stage === 8 ? 1000 :
      stage === 1 ? 300 :
      stage === 7 ? 0 :
      500;
  
    const passed =
      stage === 7
        ? score >= 0
        : score >= passScore;
  
    if (passed) {
      unlockNextStage(stage);
      refreshProgress();
      const p = getProfile();
      if (p) recordStageClear(p, stage, score).catch(() => {});
    }
  
    setResult({ score, stage, passed, passScore });
    setCurrentStage(stage);
    setScreen('result');
  }, [refreshProgress]);

  const handleEndlessComplete = useCallback((score: number, highScore: number) => {
    setResult({ score, stage: 'endless', passed: true, highScore });
    const p = getProfile();

if (p) {
  console.log('[StageClear] saving', { profile: p, stage, score });

  recordStageClear(p, stage, score)
    .then(() => console.log('[StageClear] saved'))
    .catch((err) => console.error('[StageClear] failed', err));
} else {
  console.warn('[StageClear] no profile');
}
    setScreen('result');
  }, []);

  const handleRetry = useCallback(() => {
    if (result?.stage === 'endless') {
      setScreen('endless');
    } else if (typeof result?.stage === 'number') {
      setScreen(`stage${result.stage}` as Screen);
    }
  }, [result]);

  const handleNext = useCallback(() => {
    if (typeof result?.stage === 'number') {
      const next = result.stage + 1;
      if (next <= 8) {
        setCurrentStage(next);
        setScreen(`stage${next}` as Screen);
      } else {
        refreshProgress();
        setScreen('campaign');
      }
    }
  }, [result, refreshProgress]);

  // Hidden dev reset: 5-tap on version text in TitleScreen
  const handleResetProfile = useCallback(() => {
    clearProfile();
    setProfile(null);
    setProgress(getProgress());
    setScreen('register');
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
        className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-yellow-400 to-orange-500"
        style={{ maxWidth: '430px', margin: '0 auto' }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🏭</div>
          <div className="font-game text-white text-lg" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}>
            กำลังโหลด...
          </div>
        </div>
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
      {screen === 'edit_profile' && profile && !profile.profileLocked && (
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
          onEndless={() => setScreen('endless')}
          onLeaderboard={() => setScreen('leaderboard')}
          onEditProfile={profile.profileLocked ? undefined : () => setScreen('edit_profile')}
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
        <Stage3TapHazard
          key={`s3-${currentStage}`}
          onComplete={(score) => handleStageComplete(score, 3)}
        />
      )}

      {screen === 'stage4' && (
        <Stage4ClawMachine
          key={`s4-${currentStage}`}
          onComplete={(score) => handleStageComplete(score, 4)}
        />
      )}

      {screen === 'stage5' && (
        <Stage5HazardDefense
          key={`s5-${currentStage}`}
          onComplete={(score) => handleStageComplete(score, 5)}
        />
      )}

      {screen === 'stage6' && (
        <Stage6MachineSync
          key={`s6-${currentStage}`}
          onComplete={(score) => handleStageComplete(score, 6)}
        />
      )}

      {screen === 'stage7' && (
        <Stage7ForklifPanic
          key={`s7-${currentStage}`}
          onComplete={(score) => handleStageComplete(score, 7)}
        />
      )}

{screen === 'stage8' && (
  <Stage8FinalChaos
    key={`s8-${currentStage}`}
    onComplete={(score) => handleStageComplete(score, 8)}
  />
)}

      {screen === 'endless' && (
        <EndlessMode
          key="endless"
          onComplete={handleEndlessComplete}
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
