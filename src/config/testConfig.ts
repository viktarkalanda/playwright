export type UserKey = 'standard';

export interface UserCredentials {
  username: string;
  password: string;
}

const users: Record<UserKey, UserCredentials> = {
  standard: {
    username: 'standard_user',
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
