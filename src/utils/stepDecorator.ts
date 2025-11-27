// src/utils/stepDecorator.ts
import { test } from '@playwright/test';

export function step(name?: string) {
  return function (value: any, context: any) {
    const stepName = name ?? String(context.name);

    return async function (this: any, ...args: any[]) {
      return test.step(stepName, async () => {
        return value.apply(this, args);
      });
    };
  };
}
