/* eslint-disable check-file/no-index */
// biome-ignore lint/style/noRestrictedImports: playwright test utilities needed for test fixtures
import { mergeTests } from '@playwright/test'
import { test as amplitudeTest } from 'playwright/fixtures/amplitude'
import { test as anvilTest } from 'playwright/fixtures/anvil'
import { test as graphqlTest } from 'playwright/fixtures/graphql'
import { test as tradingApiTest } from 'playwright/fixtures/tradingApi'

// biome-ignore-start lint/style/noRestrictedImports: playwright re-export needed for test framework
// eslint-disable-next-line no-restricted-syntax
export * from '@playwright/test'

// biome-ignore-end lint/style/noRestrictedImports: playwright re-export needed for test framework

// Configuration interface for test fixtures
interface TestConfig {
  withAnvil?: boolean
}

// Get the merged test types
const getAnvilTest = () => mergeTests(anvilTest, graphqlTest, amplitudeTest, tradingApiTest)
const getBaseTest = () => mergeTests(graphqlTest, amplitudeTest, tradingApiTest)

// Type for test with anvil
type AnvilTest = ReturnType<typeof getAnvilTest>

// Type for test without anvil
type BaseTest = ReturnType<typeof getBaseTest>

// Factory function to get the appropriate test fixture with overloads
export function getTest(config: { withAnvil: true }): AnvilTest
export function getTest(config?: { withAnvil?: false }): BaseTest
export function getTest(config: TestConfig = {}): BaseTest | AnvilTest {
  if (config.withAnvil) {
    // Return test with all fixtures including anvil for blockchain tests
    return getAnvilTest()
  }
  // Return test without anvil for regular e2e tests
  return getBaseTest()
}

export type GetTestResult = ReturnType<typeof getTest>
