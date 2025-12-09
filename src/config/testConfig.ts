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

const users: Record<UserKey, UserCredentials> = {
  standard: {
    username: 'standard_user',
    password: 'secret_sauce',
  },
  lockedOut: {
    username: 'locked_out_user',
    password: 'secret_sauce',
  },
  problem: {
    username: 'problem_user',
    password: 'secret_sauce',
  },
  performanceGlitch: {
    username: 'performance_glitch_user',
    password: 'secret_sauce',
  },
  error: {
    username: 'error_user',
    password: 'secret_sauce',
  },
  visual: {
    username: 'visual_user',
    password: 'secret_sauce',
  },
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
    return this.users[key];
  }
}
