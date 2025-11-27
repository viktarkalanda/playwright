// src/utils/stepDecorator.ts
import { test } from '@playwright/test';

// Loose typing on purpose to avoid TS decorator signature conflicts
export function step(name?: string): any {
  return function (value: any, context: { name?: string | symbol }) {
    const stepName = name ?? String(context.name ?? 'step');

    return function (this: any, ...args: any[]) {
      return test.step(stepName, async () => {
        return value.apply(this, args);
      });
    };
  };
}
