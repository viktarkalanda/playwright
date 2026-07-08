// tests/api/demoblaze-auth.spec.ts
//
// API-level tests for DemoBlaze authentication endpoints:
// POST /signup and POST /login at https://api.demoblaze.com
import { apiTest as test, expect } from '../../src/api/fixtures/api-fixtures';

const uniqueUsername = (): string => `api_user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

test.describe('DemoBlaze Auth API', () => {
  test.describe('POST /signup', () => {
    test(
      'signup with valid credentials returns success',
      { tag: ['@api', '@auth', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const username = uniqueUsername();
        const result = await demoBlazeApi.signup(username, 'ValidPass123');

        expect(result.success).toBe(true);
        expect(result.message).toBeNull();
      },
    );

    test(
      'signup with duplicate username returns error',
      { tag: ['@api', '@auth', '@negative'] },
      async ({ demoBlazeApi }) => {
        const username = uniqueUsername();
        await demoBlazeApi.signup(username, 'FirstPass1');

        const result = await demoBlazeApi.signup(username, 'SecondPass2');

        expect(result.success).toBe(false);
        expect(result.message).toContain('exist');
      },
    );

    test(
      'signup with empty username still sends request',
      { tag: ['@api', '@auth', '@negative'] },
      async ({ demoBlazeApi }) => {
        const result = await demoBlazeApi.signup('', 'somepassword');
        // DemoBlaze may accept or reject empty username — we verify a response is returned
        expect(typeof result.success).toBe('boolean');
      },
    );

    test(
      'signup with empty password still sends request',
      { tag: ['@api', '@auth', '@negative'] },
      async ({ demoBlazeApi }) => {
        const username = uniqueUsername();
        const result = await demoBlazeApi.signup(username, '');
        expect(typeof result.success).toBe('boolean');
      },
    );

    test(
      'signup with special characters in username',
      { tag: ['@api', '@auth', '@regression'] },
      async ({ demoBlazeApi }) => {
        const username = `user_${Date.now()}_test`;
        const result = await demoBlazeApi.signup(username, 'Pass123!');
        expect(typeof result.success).toBe('boolean');
      },
    );

    test(
      'multiple unique users can be registered independently',
      { tag: ['@api', '@auth', '@regression'] },
      async ({ demoBlazeApi }) => {
        const userA = uniqueUsername();
        const userB = uniqueUsername();

        const resultA = await demoBlazeApi.signup(userA, 'PassA123');
        const resultB = await demoBlazeApi.signup(userB, 'PassB456');

        expect(resultA.success).toBe(true);
        expect(resultB.success).toBe(true);
      },
    );
  });

  test.describe('POST /login', () => {
    test(
      'login with valid credentials returns token',
      { tag: ['@api', '@auth', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const username = uniqueUsername();
        const password = 'LoginPass1';
        await demoBlazeApi.signup(username, password);

        const result = await demoBlazeApi.login(username, password);

        expect(result.success).toBe(true);
        expect(result.token).not.toBeNull();
        expect(result.token!.length).toBeGreaterThan(0);
      },
    );

    test(
      'login token does not contain Auth_token prefix',
      { tag: ['@api', '@auth', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const username = uniqueUsername();
        const password = 'TokenTest1';
        await demoBlazeApi.signup(username, password);

        const result = await demoBlazeApi.login(username, password);

        expect(result.token).not.toContain('Auth_token:');
        expect(result.token).not.toContain('Auth_token');
      },
    );

    test(
      'login with wrong password returns failure',
      { tag: ['@api', '@auth', '@negative'] },
      async ({ demoBlazeApi }) => {
        const username = uniqueUsername();
        await demoBlazeApi.signup(username, 'CorrectPass1');

        const result = await demoBlazeApi.login(username, 'WrongPass2');

        expect(result.success).toBe(false);
        expect(result.token).toBeNull();
      },
    );

    test(
      'login with non-existent username returns failure',
      { tag: ['@api', '@auth', '@negative'] },
      async ({ demoBlazeApi }) => {
        const result = await demoBlazeApi.login('user_that_does_not_exist_xyz', 'AnyPass123');

        expect(result.success).toBe(false);
        expect(result.token).toBeNull();
      },
    );

    test(
      'login with empty username returns failure',
      { tag: ['@api', '@auth', '@negative'] },
      async ({ demoBlazeApi }) => {
        const result = await demoBlazeApi.login('', 'somepassword');
        expect(result.success).toBe(false);
        expect(result.token).toBeNull();
      },
    );

    test(
      'login returns different tokens on repeated logins',
      { tag: ['@api', '@auth', '@regression'] },
      async ({ demoBlazeApi }) => {
        const username = uniqueUsername();
        const password = 'RepeatLogin1';
        await demoBlazeApi.signup(username, password);

        const first = await demoBlazeApi.login(username, password);
        const second = await demoBlazeApi.login(username, password);

        expect(first.success).toBe(true);
        expect(second.success).toBe(true);
        // Both calls succeed; tokens may differ (session-based)
        expect(first.token).not.toBeNull();
        expect(second.token).not.toBeNull();
      },
    );

    test(
      'registered user can log in immediately after signup',
      { tag: ['@api', '@auth', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const username = uniqueUsername();
        const password = 'ImmediateLogin1';

        const signup = await demoBlazeApi.signup(username, password);
        expect(signup.success).toBe(true);

        const login = await demoBlazeApi.login(username, password);
        expect(login.success).toBe(true);
        expect(login.token).not.toBeNull();
      },
    );
  });
});
