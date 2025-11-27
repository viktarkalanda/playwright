// src/utils/stepDecorator.ts
import { test } from '@playwright/test';

/**
 * Decorator to wrap method body into Playwright test.step
 * Allure will show these as steps via allure-playwright reporter
 */
export function step(name?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const stepName = name ?? propertyKey;

    descriptor.value = async function (...args: unknown[]) {
      return test.step(stepName, async () => {
        return originalMethod.apply(this, args);
      });
    };
  };
}
