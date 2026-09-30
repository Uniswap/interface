import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

// ≤640px renders modals as the mobile-web bottom sheet; hasTouch enables real touch input.
test.use({ hasTouch: true, viewport: { width: 449, height: 900 } })

const OPEN_SHEET = '.uw-sheet-frame[data-state="open"]'

test.describe(
  'WebBottomSheet dismissal on touch devices (SWAP-3262)',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('touch tap on the scrim dismisses the token selector sheet', async ({ page }) => {
      await page.goto('/swap')
      await page.getByTestId(TestID.ChooseOutputToken).tap()

      const frame = page.locator(OPEN_SHEET).last()
      await expect(frame).toBeVisible()

      // Scrim presses are ignored until the open animation arms dismissal, so retry the tap
      // instead of racing it with a fixed wait.
      await expect(async () => {
        const box = await frame.boundingBox()
        if (box) {
          await page.touchscreen.tap(224, Math.max(100, box.y - 40))
        }
        await expect(page.locator(OPEN_SHEET)).toHaveCount(0, { timeout: 1000 })
      }).toPass({ timeout: 10_000 })
    })

    test('touch tap inside the sheet does not dismiss it', async ({ page }) => {
      await page.goto('/swap')
      await page.getByTestId(TestID.ChooseOutputToken).tap()

      const frame = page.locator(OPEN_SHEET).last()
      await expect(frame).toBeVisible()

      const box = await frame.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + 60)
      }
      await page.waitForTimeout(500)
      await expect(page.locator(OPEN_SHEET).last()).toBeVisible()
    })
  },
)
