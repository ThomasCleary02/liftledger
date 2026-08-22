const isDev = process.env.NODE_ENV === "development";

function formatDetail(error?: unknown): string | undefined {
  if (error == null) return undefined;
  if (error instanceof Error) {
    const code =
      typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : "";
    return code ? `${code}: ${error.message}` : `${error.name}: ${error.message}`;
  }
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code ?? "");
    const message =
      "message" in error ? String((error as { message?: string }).message ?? "") : "";
    return [code, message].filter(Boolean).join(": ");
  }
  return String(error);
}

export const logger = {
  error: (message: string, error?: unknown) => {
    const detail = formatDetail(error);
    if (detail) console.error(`[Error] ${message} — ${detail}`);
    else console.error(`[Error] ${message}`);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn(`[Warning] ${message}`, ...args.map((arg) => formatDetail(arg) ?? arg));
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[Info] ${message}`, ...args);
    }
  },
};
