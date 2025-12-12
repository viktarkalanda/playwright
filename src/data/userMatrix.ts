import { UserKey } from '../config/testConfig';

export type LoginExpectation = 'success' | 'locked' | 'invalid';

export interface UserBehaviorProfile {
  key: UserKey;
  description: string;
  loginExpectation: LoginExpectation;
  knownIssues?: string[];
  canCheckout?: boolean;
}

export const userBehaviorMatrix: UserBehaviorProfile[] = [
  {
    key: 'standard',
    description: 'Standard user with fully working flows',
    loginExpectation: 'success',
    canCheckout: true,
  },
  {
    key: 'lockedOut',
    description: 'Locked out user; login should be rejected with specific error',
    loginExpectation: 'locked',
    canCheckout: false,
  },
  {
    key: 'problem',
    description: 'Problem user; UI glitches but core flows should still be available',
    loginExpectation: 'success',
    canCheckout: true,
    knownIssues: ['broken images', 'weird item images'],
  },
  {
    key: 'performanceGlitch',
    description: 'Performance glitch user; flows are slower but pass eventually',
    loginExpectation: 'success',
    canCheckout: true,
    knownIssues: ['slower inventory and cart loading'],
  },
  {
    key: 'error',
    description: 'Error user; may produce errors in checkout or other flows',
    loginExpectation: 'success',
    canCheckout: false,
    knownIssues: ['checkout issues'],
  },
  {
    key: 'visual',
    description: 'Visual user; visual glitches but functional behavior should remain',
    loginExpectation: 'success',
    canCheckout: true,
    knownIssues: ['visual glitches'],
  },
];

export function getUserProfile(key: UserKey): UserBehaviorProfile {
  const profile = userBehaviorMatrix.find((p) => p.key === key);
  if (!profile) {
    throw new Error(`No behavior profile found for user key "${key}"`);
  }
  return profile;
}
