// tests/ui/second-shop/contact-form.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';

test.describe('Contact form', () => {
  test.beforeEach(async ({ secondHomePage }) => {
    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
  });

  test('Contact link opens the modal', { tag: ['@contact', '@smoke', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();

    expect(await secondContactModal.isOpen()).toBe(true);
  });

  test('modal can be closed without sending', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.close();

    expect(await secondContactModal.isOpen()).toBe(false);
  });

  test('all three fields accept input', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: 'John', email: 'john@test.com', message: 'Hello world' });

    await expect(secondContactModal.nameInput).toHaveValue('John');
    await expect(secondContactModal.emailInput).toHaveValue('john@test.com');
    await expect(secondContactModal.messageInput).toHaveValue('Hello world');
  });

  test('sending filled form shows confirmation alert', { tag: ['@contact', '@smoke', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: 'Test User', email: 'test@example.com', message: 'Test message' });
    const alert = await secondContactModal.sendAndWaitForAlert();

    expect(alert).toBeTruthy();
  });

  test('modal closes after sending', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: 'User', email: 'u@t.com', message: 'msg' });
    await secondContactModal.sendAndWaitForAlert();

    expect(await secondContactModal.isOpen()).toBe(false);
  });

  test('sending with name only triggers a response', { tag: ['@contact', '@negative', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: 'OnlyName', email: '', message: '' });
    const alert = await secondContactModal.sendAndWaitForAlert();

    expect(alert).toBeTruthy();
  });

  test('sending with no fields triggers a response', { tag: ['@contact', '@negative', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    const alert = await secondContactModal.sendAndWaitForAlert();

    expect(alert).toBeTruthy();
  });

  test('name input accepts long text', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    const longName = 'A'.repeat(100);
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: longName });

    const value = await secondContactModal.nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('message field accepts multi-line text', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    const multiLine = 'Line one\nLine two\nLine three';
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ message: multiLine });

    const value = await secondContactModal.messageInput.inputValue();
    expect(value).toContain('Line one');
  });
});
