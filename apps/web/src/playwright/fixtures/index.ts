// oxlint-disable eslint-js/no-restricted-syntax
// oxlint-disable-next-line no-restricted-imports -- playwright test utilities needed for test fixtures
import { mergeTests } from '@playwright/test'
import { test as amplitudeTest } from '~/playwright/fixtures/amplitude'
import { test as anvilTest } from '~/playwright/fixtures/anvil'
import { test as consoleForwardTest } from '~/playwright/fixtures/consoleForward'
import { test as dataApiTest } from '~/playwright/fixtures/dataApi'
import { test as graphqlTest } from '~/playwright/fixtures/graphql'
import { test as tradingApiTest } from '~/playwright/fixtures/tradingApi'
import { test as walletConnectTest } from '~/playwright/fixtures/walletConnect'

// oxlint-disable-next-line no-restricted-imports -- playwright re-export needed for test framework; biome-parity: oxlint is stricter here
export * from '@playwright/test'

// Configuration interface for test fixtures
interface TestConfig {
  withAnvil?: boolean
  withWalletConnect?: boolean
}

// Get the merged test types
const getAnvilTest = () =>
  mergeTests(anvilTest, graphqlTest, amplitudeTest, tradingApiTest, dataApiTest, consoleForwardTest)
const getAnvilWalletConnectTest = () =>
  mergeTests(anvilTest, graphqlTest, amplitudeTest, tradingApiTest, dataApiTest, consoleForwardTest, walletConnectTest)
const getBaseTest = () => mergeTests(graphqlTest, amplitudeTest, tradingApiTest, dataApiTest, consoleForwardTest)

// Type for test with anvil
type AnvilTest = ReturnType<typeof getAnvilTest>

// Type for test with anvil + WalletConnect (hermetic relay + counterparty)
type AnvilWalletConnectTest = ReturnType<typeof getAnvilWalletConnectTest>

// Type for test without anvil
type BaseTest = ReturnType<typeof getBaseTest>

// Factory function to get the appropriate test fixture with overloads
export function getTest(config: { withAnvil: true; withWalletConnect: true }): AnvilWalletConnectTest
export function getTest(config: { withAnvil: true; withWalletConnect?: false }): AnvilTest
export function getTest(config?: { withAnvil?: false; withWalletConnect?: false }): BaseTest
export function getTest(config: TestConfig = {}): BaseTest | AnvilTest | AnvilWalletConnectTest {
  if (config.withAnvil && config.withWalletConnect) {
    // Return test with anvil + the hermetic WalletConnect relay/counterparty fixtures
    return getAnvilWalletConnectTest()
  }
  if (config.withAnvil) {
    // Return test with all fixtures including anvil for blockchain tests
    return getAnvilTest()
  }
  // Return test without anvil for regular e2e tests
  return getBaseTest()
}

export type GetTestResult = ReturnType<typeof getTest>
