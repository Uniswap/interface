// eslint-disable-next-line check-file/no-index
import { test as amplitudeTest } from 'playwright/fixtures/amplitude'
import { test as anvilTest } from 'playwright/fixtures/anvil'
import { test as graphqlTest } from 'playwright/fixtures/graphql'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { mergeTests } from '@playwright/test'
// eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-restricted-imports
export * from '@playwright/test'

export const test = mergeTests(anvilTest, graphqlTest, amplitudeTest)
