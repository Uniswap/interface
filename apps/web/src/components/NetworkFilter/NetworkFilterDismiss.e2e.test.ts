import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

// ≤450px renders the network filter as the mycelium mobile-web bottom sheet; hasTouch enables real touch input.
test.use({ hasTouch: true, viewport: { width: 449, height: 900 } })

const OPEN_SHEET = '.mc-sheet-frame[data-state="open"]'

test.describe(
  'Network filter WebBottomSheet dismissal on touch devices (SWAP-3262)',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('touch tap on the scrim dismisses the network filter sheet', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum')
      await page.getByTestId(TestID.TokensNetworkFilterTrigger).tap()

      const frame = page.locator(OPEN_SHEET).last()
      await expect(frame).toBeVisible()

      // Scrim presses are ignored until the open animation arms dismissal, so retry the tap
      // instead of racing it with a fixed wait.
      await expect(async () => {
        // Assert the sheet is still visible immediately before each tap so this test actually
        // discriminates the fix: without this, a spontaneous/unrelated close would still let
        // the toHaveCount(0) assertion below pass.
        await expect(frame).toBeVisible()
        const box = await frame.boundingBox()
        expect(box).not.toBeNull()
        if (box) {
          // Derive the tap x-coordinate from the sheet's bounding box (like the test below)
          // instead of a hardcoded value coupled to the 449px viewport set above.
          await page.touchscreen.tap(box.x + box.width / 2, Math.max(100, box.y - 40))
        }
        await expect(page.locator(OPEN_SHEET)).toHaveCount(0, { timeout: 1000 })
      }).toPass({ timeout: 10_000 })
    })

    test('touch tap inside the sheet does not dismiss it', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum')
      await page.getByTestId(TestID.TokensNetworkFilterTrigger).tap()

      const frame = page.locator(OPEN_SHEET).last()
      await expect(frame).toBeVisible()

      // Wait out the open-animation arming delay (SHEET_ANIMATION_DURATION, 200ms) before
      // tapping, as the sibling test's retry loop above effectively does. Without this, the tap
      // below would land before dismissal is armed and stay a no-op for that reason alone — the
      // assertion would then pass even if in-sheet presses did reach the scrim's dismiss handler,
      // which is the real thing this negative control needs to rule out.
      await page.waitForTimeout(250)

      // Tap the drag handle area specifically (not the option list right below it) so this
      // doesn't accidentally select a network row, which legitimately closes the sheet.
      const box = await frame.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + 20)
      }
      await page.waitForTimeout(500)
      await expect(page.locator(OPEN_SHEET).last()).toBeVisible()
    })
  },
)
