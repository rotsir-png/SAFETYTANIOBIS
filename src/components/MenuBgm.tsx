import { useEffect, useRef } from 'react';
import { isSoundEnabled } from '../sound';

export default function MenuBgm() {
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const bgm = new Audio('/bgm/menu.wav');
    bgm.loop = true;
    bgm.volume = 0.35;
    bgmRef.current = bgm;

    const stop = () => {
      bgm.pause();
      bgm.currentTime = 0;
    };

    const play = () => {
      if (!isSoundEnabled()) {
        stop();
        return;
      }

      if (!bgm.paused) return;
      bgm.play().catch(() => {});
    };

    const syncSoundSetting = () => {
      if (!isSoundEnabled()) {
        stop();
      } else {
        play();
      }
    };

    const unlockOnce = () => {
      play();
      document.removeEventListener('click', unlockOnce);
      document.removeEventListener('touchend', unlockOnce);
    };

    document.addEventListener('click', unlockOnce);
    document.addEventListener('touchend', unlockOnce);
    window.addEventListener('sound-setting-changed', syncSoundSetting);

    syncSoundSetting();

    return () => {
      stop();
      document.removeEventListener('click', unlockOnce);
      document.removeEventListener('touchend', unlockOnce);
      window.removeEventListener('sound-setting-changed', syncSoundSetting);
    };
  }, []);

  return null;
}