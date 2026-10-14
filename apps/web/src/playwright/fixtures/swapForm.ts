import { TestID } from '@universe/test'
import type { Page } from '~/playwright/fixtures'

/** Enters the input amount, opens review, and confirms. Resolves once the confirm click is dispatched. */
export async function submitSwapForm({ page, amount }: { page: Page; amount: string }): Promise<void> {
  await page.getByTestId(TestID.AmountInputIn).click()
  await page.getByTestId(TestID.AmountInputIn).fill(amount)
  await page.getByTestId(TestID.ReviewSwap).click()
  await page.getByTestId(TestID.Swap).click()
}
