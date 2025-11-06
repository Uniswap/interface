import type { Page } from 'playwright'
import { UserRejectedRequestError } from 'viem'
import { mock } from 'wagmi/connectors'

/**
 * A mock connector that can be programmatically told to reject transactions.
 * Set window.__WAGMI_REJECT_TRANSACTION__ = true to reject the next transaction.
 */
export function createRejectableMockConnector(config: Parameters<typeof mock>[0]) {
  return (createConnectorParams: Parameters<ReturnType<typeof mock>>[0]) => {
    const mockConnectorFactory = mock(config)
    const baseConnector = mockConnectorFactory(createConnectorParams)

    return {
      ...baseConnector,
      async getProvider() {
        const provider = await baseConnector.getProvider()
        const originalRequest = provider.request.bind(provider)

        const interceptor: typeof provider.request = async (args) => {
          if (shouldRejectTransaction(args.method)) {
            throw new UserRejectedRequestError(new Error('User rejected the transaction'))
          }
          return originalRequest(args as any)
        }
        provider.request = interceptor

        return provider
      },
    }
  }
}

export async function rejectNextTransaction(page: Page) {
  await page.evaluate(() => {
    ;(window as any).__WAGMI_REJECT_TRANSACTION__ = true
  })
}

/**
 * Checks if the transaction should be rejected based on method and window flag
 */
function shouldRejectTransaction(method: string): boolean {
  const isTransactionMethod = method === 'eth_sendTransaction' || method === 'eth_sendRawTransaction'
  const hasRejectionFlag = (window as any).__WAGMI_REJECT_TRANSACTION__
  if (isTransactionMethod && hasRejectionFlag) {
    // Clear flag after first rejection
    delete (window as any).__WAGMI_REJECT_TRANSACTION__
    return true
  }
  return false
}
