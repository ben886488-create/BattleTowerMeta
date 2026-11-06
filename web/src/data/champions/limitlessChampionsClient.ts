export const LIMITLESS_CHAMPIONS_BASE_URL = "https://play.limitlesstcg.com/api";

export type LimitlessApiObject = Record<string, unknown>;

export type LimitlessGame = {
  id: string;
  name: string;
  raw: LimitlessApiObject;
};

export type LimitlessChampionsClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  concurrency?: number;
  logger?: Pick<Console, "warn" | "error">;
};

class RequestLimiter {
  private active = 0;
  private readonly queue: Array<() => void> = [];
  private readonly limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = () => {
        this.active += 1;
        void task()
          .then(resolve, reject)
          .finally(() => {
            this.active -= 1;
            this.queue.shift()?.();
          });
      };
      if (this.active < this.limit) execute();
      else this.queue.push(execute);
    });
  }
}

export class LimitlessChampionsClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly limiter: RequestLimiter;
  private readonly logger: Pick<Console, "warn" | "error">;

  constructor(options: LimitlessChampionsClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? LIMITLESS_CHAMPIONS_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.limiter = new RequestLimiter(Math.max(1, options.concurrency ?? 4));
    this.logger = options.logger ?? console;
  }

  async getGames(): Promise<LimitlessGame[]> {
    const response = await this.request<unknown>("/games");
    if (!Array.isArray(response)) return [];
    return response.flatMap((value) => {
      const raw = asRecord(value);
      const id = textValue(raw.id);
      const name = textValue(raw.name);
      return id && name ? [{ id, name, raw }] : [];
    });
  }

  async findChampionsGame(): Promise<LimitlessGame | null> {
    const games = await this.getGames();
    const candidates = games
      .map((game) => ({ game, score: championsGameScore(game) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (!best || (candidates[1] && candidates[1].score === best.score)) {
      this.logger.warn("[Limitless Champions] No unambiguous Pokémon Champions / VGC game id was found; skipping tournament sync.");
      return null;
    }
    return best.game;
  }

  async getTournaments(gameId: string, limit = 50): Promise<LimitlessApiObject[]> {
    const response = await this.request<unknown>("/tournaments", {
      game: gameId,
      limit: String(limit),
    });
    return Array.isArray(response) ? response.map(asRecord).filter(hasKeys) : [];
  }

  async getTournamentStandings(tournamentId: string): Promise<LimitlessApiObject[] | null> {
    const response = await this.request<unknown>(
      `/tournaments/${encodeURIComponent(tournamentId)}/standings`,
    );
    return Array.isArray(response) ? response.map(asRecord).filter(hasKeys) : null;
  }

  private request<T>(path: string, query: Record<string, string> = {}): Promise<T | null> {
    return this.limiter.run(async () => {
      const base = `${this.baseUrl.replace(/\/+$/, "")}/`;
      const url = new URL(path.replace(/^\/+/, ""), base);
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

      let lastError: unknown = null;
      for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          const response = await fetch(url, {
            headers: { accept: "application/json" },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
          return await response.json() as T;
        } catch (error) {
          lastError = error;
          if (attempt < this.maxRetries) await delay(300 * (attempt + 1));
        } finally {
          clearTimeout(timeout);
        }
      }

      this.logger.warn(`[Limitless Champions] ${url.pathname} failed after ${this.maxRetries + 1} attempts`, lastError);
      return null;
    });
  }
}

function championsGameScore(game: LimitlessGame): number {
  const haystack = `${game.id} ${game.name}`.toLowerCase();
  const isPokemon = /pok[eé]mon/.test(haystack);
  if (isPokemon && /champions/.test(haystack)) return 120;
  if (isPokemon && /\bvgc\b/.test(haystack)) return 110;
  if (/\bvgc\b/.test(haystack)) return 90;
  if (/champions/.test(haystack)) return 70;
  return 0;
}

function asRecord(value: unknown): LimitlessApiObject {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as LimitlessApiObject
    : {};
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasKeys(value: LimitlessApiObject): boolean {
  return Object.keys(value).length > 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
