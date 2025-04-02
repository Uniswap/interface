// eslint-disable-next-line check-file/no-index
import { Page } from 'playwright/fixtures'

export const gotoAndWait = async (page: Page, url: string) => {
  await page.goto(url)
  await page.waitForLoadState('load')
}
