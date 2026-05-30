const SOUND_KEY = 'safety_game_sound_enabled';

let audioUnlocked = false;

export function isSoundEnabled() {
  const saved = localStorage.getItem(SOUND_KEY);
  return saved !== 'false';
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(SOUND_KEY, String(enabled));
  window.dispatchEvent(new Event('sound-setting-changed'));
}

export function toggleSoundEnabled() {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
}

export async function unlockAudio() {
  if (audioUnlocked || !isSoundEnabled()) return;

  try {
    const audio = new Audio('/sfx/correct.wav');
    audio.volume = 0;
    audio.muted = true;

    await audio.play();

    audio.pause();
    audio.currentTime = 0;
    audioUnlocked = true;
  } catch {
    // LINE / iOS บางทีไม่ให้ผ่าน ไม่ต้อง crash
  }
}

export function playSfx(audio: HTMLAudioElement) {
  if (!isSoundEnabled()) return;

  try {
    audio.pause();
    audio.currentTime = 0;

    const p = audio.play();
    if (p) p.catch(() => {});
  } catch {
    // กัน LINE Browser งอแง
  }
}