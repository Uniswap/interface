// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { Page, test as base } from '@playwright/test'
import stagehand from 'playwright/stagehand.config'
type StagehandFixture = {
  page: typeof stagehand.page
}

export const test = base.extend<StagehandFixture>({
  // Expect typescript error here because we're overriding the built-in page fixture
  // @ts-expect-error
  // eslint-disable-next-line no-empty-pattern
  async page({}, use: (page: Page) => Promise<void>) {
    await stagehand.init()
    await use(stagehand.page)
  },
})
