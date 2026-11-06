export const CHAMPIONS_BATTLE_DATA_BASE_URL = "https://championsbattledata.com";

export type ChampionsApiObject = Record<string, unknown>;

export type ChampionsBattleDataClientOptions = {
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

export class ChampionsBattleDataClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly limiter: RequestLimiter;
  private readonly logger: Pick<Console, "warn" | "error">;

  constructor(options: ChampionsBattleDataClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? CHAMPIONS_BATTLE_DATA_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.limiter = new RequestLimiter(Math.max(1, options.concurrency ?? 5));
    this.logger = options.logger ?? console;
  }

  async getIndex(): Promise<ChampionsApiObject | null> {
    for (const endpoint of ["/api", "/api/index", "/data/pokemon-index.json"]) {
      const response = await this.request<unknown>(endpoint);
      if (isApiObject(response)) return response;
      if (Array.isArray(response)) return { pokemon: response };
    }
    return null;
  }

  getPokemon(name: string, format: string, season: string): Promise<ChampionsApiObject | null> {
    return this.requestObject(`/api/pokemon/${encodeURIComponent(name)}`, { format, season });
  }

  getBattle(format: string, name: string, season: string): Promise<ChampionsApiObject | null> {
    return this.requestObject(
      `/api/battle/${encodeURIComponent(format)}/${encodeURIComponent(name)}`,
      { season },
    );
  }

  getMetadata(name: string): Promise<ChampionsApiObject | null> {
    return this.requestObject(`/api/metadata/${encodeURIComponent(name)}`);
  }

  private async requestObject(
    path: string,
    query: Record<string, string> = {},
  ): Promise<ChampionsApiObject | null> {
    const response = await this.request<unknown>(path, query);
    return isApiObject(response) ? response : null;
  }

  private request<T>(path: string, query: Record<string, string> = {}): Promise<T | null> {
    return this.limiter.run(async () => {
      const url = new URL(path, this.baseUrl);
      for (const [key, value] of Object.entries(query)) {
        if (value) url.searchParams.set(key, value);
      }

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
          if (attempt < this.maxRetries) {
            await delay(300 * (attempt + 1));
          }
        } finally {
          clearTimeout(timeout);
        }
      }

      this.logger.warn(`[ChampionsBattleData] ${url.pathname} failed after ${this.maxRetries + 1} attempts`, lastError);
      return null;
    });
  }
}

function isApiObject(value: unknown): value is ChampionsApiObject {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
