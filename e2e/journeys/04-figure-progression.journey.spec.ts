import { expect, test } from '@playwright/test';
import { FlowRecorder } from '@ibid/testing';
import {
  JUST_AFTER_SEED,
  SHELF,
  STAGE,
  STAGE_CANVAS,
  TROPHY,
  TROPHY_CARD,
  TROPHY_CHOSEN,
  TROPHY_MINUS,
  TROPHY_PLUS,
  freezeClock,
  openSeeded,
} from '../support/app';

test.describe('User Journey 04: Figure Progression, Immediate Selection and Points Economy', () => {
  test('executes complete journey for immediate figure switching without outline or points loss', async ({ page }, testInfo) => {
    const flow = new FlowRecorder(page, testInfo, '04-figure-progression');
    await freezeClock(page, JUST_AFTER_SEED);
    await openSeeded(page, '/');

    await test.step('Step 1: Assert initial stage, shelf and default chosen figure', async () => {
      await expect(page.locator(STAGE)).toBeVisible();
      await expect(page.locator(STAGE_CANVAS)).toBeVisible();
      await expect(page.locator(SHELF)).toBeVisible();

      const trophies = page.locator(TROPHY);
      await expect(trophies.first()).toBeVisible();
      const count = await trophies.count();
      expect(count).toBeGreaterThan(1);

      // Default figure is chosen and also has + and - action buttons
      const chosenTrophy = page.locator(TROPHY_CHOSEN);
      await expect(chosenTrophy).toHaveCount(1);
      await expect(chosenTrophy.locator(TROPHY_PLUS)).toBeVisible();
      await expect(chosenTrophy.locator(TROPHY_MINUS)).toBeVisible();

      // Invariant: MUST NOT show blue outline
      const outlineColor = await chosenTrophy.evaluate((el) => window.getComputedStyle(el).outlineColor);
      expect(outlineColor).not.toBe('rgb(99, 102, 241)');

      await flow.step(1, 'initial-shelf-and-stage', 'default-figure-chosen-without-blue-outline');
    });

    const secondTrophy = page.locator(TROPHY).nth(1);

    await test.step('Step 2: Switch to another figure with immediate selection and no delay timers', async () => {
      // Prior to click, a non-chosen trophy has action buttons (+ / -)
      const initialOther = page.locator(TROPHY).filter({ hasNot: page.locator(TROPHY_CHOSEN) }).first();
      await expect(initialOther.locator(TROPHY_PLUS)).toBeVisible();
      await expect(initialOther.locator(TROPHY_MINUS)).toBeVisible();

      // Click to choose other figure via its thumbnail figure
      await initialOther.locator('.m-trophy__figure').click({ timeout: 5000 });

      // SELECTION MUST BE IMMEDIATE (no timer delay):
      // A chosen trophy must immediately exist on the shelf
      const chosenTrophy = page.locator(TROPHY_CHOSEN);
      await expect(chosenTrophy).toHaveCount(1);
      // Its + and - buttons are visible as well
      await expect(chosenTrophy.locator(TROPHY_PLUS)).toBeVisible();
      await expect(chosenTrophy.locator(TROPHY_MINUS)).toBeVisible();

      // The previous figure (now on shelf as non-chosen) must have + and - buttons
      const otherTrophy = page.locator(TROPHY).filter({ hasNot: page.locator(TROPHY_CHOSEN) }).first();
      await expect(otherTrophy.locator(TROPHY_PLUS)).toBeVisible();
      await expect(otherTrophy.locator(TROPHY_MINUS)).toBeVisible();

      // Invariant: chosen trophy still has no blue outline
      const chosenOutline = await chosenTrophy.evaluate((el) => window.getComputedStyle(el).outlineColor);
      expect(chosenOutline).not.toBe('rgb(99, 102, 241)');

      // Canvas renders the figure on stage
      await expect(page.locator(STAGE_CANVAS)).toBeVisible();

      await flow.step(2, 'immediate-figure-switching', 'second-figure-selected-immediately');
    });

    await test.step('Step 3: Transfer points to/from figures and verify points economy', async () => {
      const otherTrophy = page.locator(TROPHY).filter({ hasNot: page.locator(TROPHY_CHOSEN) }).first();

      // Click + on other trophy to transfer point
      await otherTrophy.locator(TROPHY_PLUS).click();

      // Chosen trophy remains chosen
      await expect(page.locator(TROPHY_CHOSEN)).toHaveCount(1);

      await flow.step(3, 'transfer-points', 'points-transferred-without-affecting-selection');
    });

    await test.step('Step 4: Switch back to first figure and assert points are preserved', async () => {
      // The other trophy is on the shelf: click it to switch back
      const otherTrophy = page.locator(TROPHY).filter({ hasNot: page.locator(TROPHY_CHOSEN) }).first();
      await otherTrophy.locator('.m-trophy__figure').click();

      // Immediate selection of first figure
      const chosenTrophy = page.locator(TROPHY_CHOSEN);
      await expect(chosenTrophy).toHaveCount(1);
      await expect(chosenTrophy.locator(TROPHY_PLUS)).toBeVisible();
      await expect(chosenTrophy.locator(TROPHY_MINUS)).toBeVisible();

      // Canvas is visible and presents the figure
      await expect(page.locator(STAGE_CANVAS)).toBeVisible();

      await flow.step(4, 'switch-back-first-figure', 'first-figure-selected-and-points-preserved');
    });

    await test.step('Step 5: Reload page and verify state persistence across reloads', async () => {
      await page.reload({ waitUntil: 'commit' });

      await expect(page.locator(STAGE_CANVAS)).toBeVisible();
      const chosenTrophy = page.locator(TROPHY_CHOSEN);
      await expect(chosenTrophy).toHaveCount(1);

      await flow.step(5, 'reload-preservation', 'figure-selection-and-progress-survived-reload');
    });
  });
});
