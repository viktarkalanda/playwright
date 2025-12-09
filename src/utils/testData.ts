// src/utils/testData.ts
export interface CheckoutUserData {
  firstName: string;
  lastName: string;
  postalCode: string;
}

const defaultCheckoutUser: CheckoutUserData = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};

export function makeCheckoutUserData(
  overrides: Partial<CheckoutUserData> = {},
): CheckoutUserData {
  return {
    ...defaultCheckoutUser,
    ...overrides,
  };
}

export function makeInvalidCheckoutUserData(): CheckoutUserData[] {
  return [
    makeCheckoutUserData({ firstName: '' }),
    makeCheckoutUserData({ lastName: '' }),
    makeCheckoutUserData({ postalCode: '' }),
  ];
}

