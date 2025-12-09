// src/utils/assertions.ts
import { expect } from '@playwright/test';

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

