export type UserKey =
  | 'standard'
  | 'lockedOut'
  | 'problem'
  | 'performanceGlitch'
  | 'error'
  | 'visual';

export interface UserCredentials {
  username: string;
  password: string;
}

// All SauceDemo test users share a single password.
// Override via SAUCE_PASSWORD env var in CI or when the site credentials change.
const sharedPassword = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

const users: Record<UserKey, UserCredentials> = {
  standard: { username: 'standard_user', password: sharedPassword },
  lockedOut: { username: 'locked_out_user', password: sharedPassword },
  problem: { username: 'problem_user', password: sharedPassword },
  performanceGlitch: { username: 'performance_glitch_user', password: sharedPassword },
  error: { username: 'error_user', password: sharedPassword },
  visual: { username: 'visual_user', password: sharedPassword },
};

// Environment → base URL lookup.
// Override individual URLs with the BASE_URL env var, or switch the entire
// profile with ENV=staging|local (falls back to 'prod' if unset or unknown).
const envBaseUrls: Record<string, string> = {
  prod: 'https://www.saucedemo.com/',
  staging: process.env.STAGING_BASE_URL ?? 'https://www.saucedemo.com/',
  local: process.env.LOCAL_BASE_URL ?? 'http://localhost:3000/',
};

function resolveBaseUrl(): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  const env = process.env.ENV ?? 'prod';
  return envBaseUrls[env] ?? envBaseUrls['prod'];
}

export class TestConfig {
  private static instance: TestConfig | null = null;

  readonly baseUrl: string;
  readonly users: Record<UserKey, UserCredentials>;

  private constructor() {
    this.baseUrl = resolveBaseUrl();
    this.users = users;
  }

  static getInstance(): TestConfig {
    if (!this.instance) {
      this.instance = new TestConfig();
    }
    return this.instance;
  }

  /**
   * Resets the singleton so that the next `getInstance()` call reads env vars
   * again. Intended for use in unit tests that need to test different env
   * configurations without module re-loading.
   *
   * Do NOT call this in production test code.
   */
  static reset(): void {
    this.instance = null;
  }

  getUser(key: UserKey): UserCredentials {
    const user = this.users[key];
    if (!user) {
      throw new Error(`Unknown user key: ${key}`);
    }
    return user;
  }
}
