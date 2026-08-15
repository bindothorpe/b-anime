// SSR-safe localStorage access.
// Replaces the unmaintained `local-storage` package, which picks up Node's
// global `localStorage` (broken, method-less object) and crashes during SSR.

export function get<T = unknown>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function set(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
