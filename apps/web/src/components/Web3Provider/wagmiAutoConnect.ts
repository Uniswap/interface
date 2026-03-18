import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isAddress } from 'viem'
import { connect } from 'wagmi/actions'
import { PLAYWRIGHT_CONNECT_ADDRESS } from '~/components/Web3Provider/constants'
import { createRejectableMockConnector } from '~/components/Web3Provider/rejectableConnector'
import { wagmiConfig } from '~/components/Web3Provider/wagmiConfig'

export function setupWagmiAutoConnect() {
  const params = new URLSearchParams(window.location.search)
  const isEagerlyConnect = params.get('eagerlyConnect') !== 'false'
  const eagerlyConnectAddress = params.get('eagerlyConnectAddress') ?? undefined

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
