export const ENV = {
  DEV_MODE: import.meta.env.VITE_DEV_MODE === "true",
};

export const debugLog = (...args: unknown[]) => {
  if (ENV.DEV_MODE) {
    console.log(...args);
  }
};