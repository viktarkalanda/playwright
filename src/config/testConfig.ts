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

export class TestConfig {
  private static instance: TestConfig | null = null;

  readonly baseUrl: string;
  readonly users: Record<UserKey, UserCredentials>;

  private constructor() {
    this.baseUrl = process.env.BASE_URL ?? 'https://www.saucedemo.com/';
    this.users = users;
  }

  static getInstance(): TestConfig {
    if (!this.instance) {
      this.instance = new TestConfig();
    }
    return this.instance;
  }

  getUser(key: UserKey): UserCredentials {
    const user = this.users[key];
    if (!user) {
      throw new Error(`Unknown user key: ${key}`);
    }
    return user;
  }
}
