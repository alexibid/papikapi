import { expect, test } from '@playwright/test';
import { FlowRecorder } from '@ibid/testing';
import { CHILD_GATE, EN, GATE_KEY, PROFILE, STAGE, freezeClock, openSeeded, t } from '../support/app';

test.describe('Application shell', () => {
  test('moves between the child screen, the parent gate and the diary', async ({ page }, testInfo) => {
    const recorder = new FlowRecorder(page, testInfo, 'shell-profiles');
    await freezeClock(page, 1_700_000_000_000);
    await openSeeded(page, '/');

    await expect(page.locator(STAGE)).toBeVisible();
    await expect(page.locator(PROFILE)).toBeHidden();
    await recorder.step(1, 'open the child screen', 'the 3d stage is showing and the header is silent');

    await page.locator(CHILD_GATE).click();
    await expect(page).toHaveURL(/\/adultos$/);
    for (const key of [0, 1, 2, 3]) await page.locator(GATE_KEY).nth(key).click();
    await expect(page).toHaveURL(/\/pais$/);
    await recorder.step(2, 'enter the pin', 'the parent area opens');

    await page.goto('/diario', { waitUntil: 'commit' });
    await expect(page.locator(PROFILE)).toHaveText(t('profileToChild'));
    await page.locator(PROFILE).click();
    await expect(page.locator(STAGE)).toBeVisible();
    await recorder.step(3, 'back to the child', 'the child screen returns');
  });

  test('wears the papikapi theme and fits the viewport without scrolling', async ({ page }) => {
    await freezeClock(page, 1_700_000_000_000);
    await openSeeded(page, '/');

    await expect(page.locator('body')).toHaveClass(/papikapi/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('switches the language from the header', async ({ page }) => {
    await openSeeded(page, '/diario');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('diaryTitle'));

    await page.locator('.papikapi-language').click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(EN('diaryTitle'));
  });
});
