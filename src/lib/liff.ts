import liff from '@line/liff';

export interface LineIdentity {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  verified: boolean;
}

const DEV_ID_KEY = 'factoryChaos_devLineUserId';

function getOrCreateDevId(): string {
  let id = localStorage.getItem(DEV_ID_KEY);

  if (!id) {
    id = `dev_${crypto.randomUUID()}`;
    localStorage.setItem(DEV_ID_KEY, id);
  }

  return id;
}

function makeDevIdentity(): LineIdentity {
  return {
    lineUserId: getOrCreateDevId(),
    displayName: 'Dev Player',
    pictureUrl: '',
    verified: false,
  };
}

let _initialized = false;
let _identity: LineIdentity | null = null;

export async function initLiff(): Promise<LineIdentity> {
  if (_identity) return _identity;

  const liffId = import.meta.env.VITE_LIFF_ID as string | undefined;

  if (!liffId) {
    console.warn('[LIFF] No VITE_LIFF_ID. Dev mode.');
    _identity = makeDevIdentity();
    return _identity;
  }

  try {
    if (!_initialized) {
      await liff.init({ liffId });
      _initialized = true;
    }

    // เปิดนอก LINE browser ไม่ต้อง login
    if (!liff.isInClient()) {
      console.warn('[LIFF] Not in LINE client. Dev mode.');
      _identity = makeDevIdentity();
      return _identity;
    }

    // เปิดใน LINE แต่ยังไม่ login
    if (!liff.isLoggedIn()) {
      liff.login({
        redirectUri: window.location.href,
      });

      _identity = makeDevIdentity();
      return _identity;
    }

    const profile = await liff.getProfile();

    _identity = {
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl ?? '',
      verified: true,
    };

    return _identity;
  } catch (err) {
    console.error('[LIFF] Init failed:', err);
    _identity = makeDevIdentity();
    return _identity;
  }
}

export function getLineIdentity(): LineIdentity | null {
  return _identity;
}