const BASE_URL = (import.meta as any).env?.BASE_URL ?? "/";

const valueCache = new Map<string, unknown>();
const promiseCache = new Map<string, Promise<unknown>>();

function resolveUrl(path: string) {
  const raw = String(path ?? "").trim();
  if (!raw) throw new Error("Missing public data path");
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  return `${BASE_URL}${raw.replace(/^\/+/, "")}`;
}

export async function loadPublicJson<T>(path: string): Promise<T> {
  const url = resolveUrl(path);

  if (valueCache.has(url)) {
    return valueCache.get(url) as T;
  }

  const pending = promiseCache.get(url) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const task = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url} (${response.status})`);
      }
      const payload = (await response.json()) as T;
      valueCache.set(url, payload as unknown);
      promiseCache.delete(url);
      return payload;
    })
    .catch((error) => {
      promiseCache.delete(url);
      throw error;
    });

  promiseCache.set(url, task as Promise<unknown>);
  return task;
}

export function loadTournamentList<T = unknown[]>(): Promise<T> {
  return loadPublicJson<T>("data/tournaments.json");
}

export function loadTournamentStandings<T = unknown[]>(id: string): Promise<T> {
  return loadPublicJson<T>(`data/raw/${id}/standings.json`);
}

export function loadTournamentPairings<T = unknown[]>(id: string): Promise<T> {
  return loadPublicJson<T>(`data/raw/${id}/pairings.json`);
}
