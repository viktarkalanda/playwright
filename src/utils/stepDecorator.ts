/* eslint-disable @typescript-eslint/no-explicit-any */

import { test } from '@playwright/test';

export const step: any = (name?: string) => {
  return (value: any, context: any) => {
    const stepName = name ?? String(context.name);

    return async function (this: any, ...args: any[]) {
      return test.step(stepName, async () => {
        return value.apply(this, args);
      });
    };
  };
};
