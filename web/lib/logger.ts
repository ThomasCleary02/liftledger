const isDev = process.env.NODE_ENV === "development";

export const logger = {
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error(`[Error] ${message}`, error);
    } else {
      // In production, send to error tracking service (e.g., Sentry)
      // For now, just log to console but could be replaced with error tracking
      console.error(`[Error] ${message}`, error);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn(`[Warning] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[Info] ${message}`, ...args);
    }
  },
};