// src/utils/assertions.ts
import { expect } from '@playwright/test';
import { validationMessages } from '../data/validationMessages';

export function expectStringsSortedAsc(values: string[]): void {
  const sorted = [...values].sort((a, b) => a.localeCompare(b));
  expect(values, 'Expected values to be sorted alphabetically (ascending)').toEqual(sorted);
}

export function expectStringsSortedDesc(values: string[]): void {
  const sorted = [...values].sort((a, b) => b.localeCompare(a));
  expect(values, 'Expected values to be sorted alphabetically (descending)').toEqual(sorted);
}

export function expectNumbersSortedAsc(values: number[]): void {
  const sorted = [...values].sort((a, b) => a - b);
  expect(values, 'Expected values to be sorted numerically (ascending)').toEqual(sorted);
}

export function expectNumbersSortedDesc(values: number[]): void {
  const sorted = [...values].sort((a, b) => b - a);
  expect(values, 'Expected values to be sorted numerically (descending)').toEqual(sorted);
}

function expectValidationMessage(actual: string, expected: string, assertionMessage: string): void {
  expect(actual.trim(), assertionMessage).toBe(expected);
}

export function expectUsernameRequiredError(actual: string): void {
  expectValidationMessage(actual, validationMessages.login.usernameRequired, 'Username required error should match fixture message');
}

export function expectPasswordRequiredError(actual: string): void {
  expectValidationMessage(actual, validationMessages.login.passwordRequired, 'Password required error should match fixture message');
}

export function expectInvalidCredentialsError(actual: string): void {
  expectValidationMessage(actual, validationMessages.login.invalidCredentials, 'Invalid credentials error should match fixture message');
}

export function expectLockedOutUserError(actual: string): void {
  expectValidationMessage(actual, validationMessages.login.lockedOut, 'Locked out user error should match fixture message');
}

export function expectFirstNameRequiredError(actual: string): void {
  expectValidationMessage(actual, validationMessages.checkout.firstNameRequired, 'First name required error should match fixture message');
}

export function expectLastNameRequiredError(actual: string): void {
  expectValidationMessage(actual, validationMessages.checkout.lastNameRequired, 'Last name required error should match fixture message');
}

export function expectPostalCodeRequiredError(actual: string): void {
  expectValidationMessage(actual, validationMessages.checkout.postalCodeRequired, 'Postal code required error should match fixture message');
}
