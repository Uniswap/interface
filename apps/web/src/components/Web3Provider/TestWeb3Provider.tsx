import { createWeb3Provider } from 'components/Web3Provider/createWeb3Provider'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'

/**
 * Web3Provider variant for Vitest/Playwright.
 * - Does NOT attempt to reconnect on mount (avoids wallet pop-ups/mocks).
 *
 * Tests should import this component instead of the default production provider.
 */

const TestWeb3Provider = createWeb3Provider({
  wagmiConfig,
  reconnectOnMount: false,
})

export default TestWeb3Provider
