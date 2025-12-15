// tests/ui/scenarios-e2e.spec.ts
import { test } from '../../src/fixtures/test-fixtures';
import { scenarios, getScenarioById, ScenarioDefinition } from '../../src/utils/scenarioDefinitions';
import { runScenario, ScenarioRunnerContext } from '../../src/utils/scenarioRunner';

test.describe('Scenario DSL e2e flows', () => {
  const execute = (scenario: ScenarioDefinition): void => {
    test(scenario.name, { tag: scenario.tags }, async ({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    }) => {
      const ctx: ScenarioRunnerContext = {
        page,
        loginPage,
        inventoryPage,
        cartPage,
        checkoutStepOnePage,
        checkoutStepTwoPage,
        checkoutCompletePage,
        productDetailsPage,
        headerMenu,
      };
      await runScenario(ctx, scenario);
    });
  };

  for (const scenario of scenarios) {
    execute(scenario);
  }

  test('Smoke scenario: single item checkout via DSL', {
    tag: ['@scenario', '@smoke', '@checkout', '@e2e'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const scenario = getScenarioById('smoke_checkout_single_item');
    const ctx: ScenarioRunnerContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    await runScenario(ctx, scenario);
  });

  test('Regression scenario: multiple item checkout via DSL', {
    tag: ['@scenario', '@regression', '@checkout', '@e2e'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const scenario = getScenarioById('regression_checkout_multiple_items');
    const ctx: ScenarioRunnerContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    await runScenario(ctx, scenario);
  });
});
