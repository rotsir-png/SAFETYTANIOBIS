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

export function playSfx(audio: HTMLAudioElement) {
  if (!isSoundEnabled()) return;

  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}