import { PLAYWRIGHT_CONNECT_ADDRESS } from 'components/Web3Provider/constants'
import { createRejectableMockConnector } from 'components/Web3Provider/rejectableConnector'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isAddress } from 'viem'
import { connect } from 'wagmi/actions'

export function setupWagmiAutoConnect() {
  const isEagerlyConnect = !window.location.search.includes('eagerlyConnect=false')
  const eagerlyConnectAddress = window.location.search.includes('eagerlyConnectAddress=')
    ? window.location.search.split('eagerlyConnectAddress=')[1]
    : undefined

  // Automatically connect if running under Playwright (used by E2E tests)
  if (isPlaywrightEnv() && isEagerlyConnect) {
    // setTimeout avoids immediate disconnection caused by race condition in wagmi mock connector
    setTimeout(() => {
      connect(wagmiConfig, {
        connector: createRejectableMockConnector({
          features: {},
          accounts: [
            eagerlyConnectAddress && isAddress(eagerlyConnectAddress)
              ? eagerlyConnectAddress
              : PLAYWRIGHT_CONNECT_ADDRESS,
          ],
        }),
      })
    }, 1)
  }
}
