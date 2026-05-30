const SOUND_KEY = 'safety_game_sound_enabled';

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

export async function unlockAudioElements(audios: HTMLAudioElement[]) {
  if (!isSoundEnabled()) return;

  await Promise.allSettled(
    audios.map(async (audio) => {
      try {
        const oldVolume = audio.volume;

        audio.muted = true;
        audio.volume = 0;
        audio.currentTime = 0;

        await audio.play();

        audio.pause();
        audio.currentTime = 0;
        audio.volume = oldVolume;
        audio.muted = false;
      } catch {
        audio.muted = false;
      }
    })
  );
}

let lastSfxTime = 0;

export function playSfx(audio: HTMLAudioElement) {
  // ปิด SFX ชั่วคราวเพื่อกัน LINE Browser ค้าง
  return;
}

export function stopSfx(audio: HTMLAudioElement) {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // noop
  }
}