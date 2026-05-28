import { isE2eTestEnv } from '@universe/environment'
import { connect } from 'wagmi/actions'
import { isAddress } from '~/chains'
import { PLAYWRIGHT_CONNECT_ADDRESS } from '~/connection/constants'
import { createRejectableMockConnector } from '~/connection/rejectableConnector'
import { wagmiConfig } from '~/connection/wagmiConfig'

export function setupWagmiAutoConnect() {
  const params = new URLSearchParams(window.location.search)
  const isEagerlyConnect = params.get('eagerlyConnect') !== 'false'
  const eagerlyConnectAddress = params.get('eagerlyConnectAddress') ?? undefined

  // Automatically connect if running under Playwright (used by E2E tests)
  if (isE2eTestEnv() && isEagerlyConnect) {
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
