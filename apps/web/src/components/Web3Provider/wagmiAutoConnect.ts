import { isE2eTestEnv } from '@universe/environment'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { connect } from 'wagmi/actions'
import { isAddress } from '~/chains'
import { PLAYWRIGHT_CONNECT_ADDRESS } from '~/connection/constants'
import { createRejectableMockConnector } from '~/connection/rejectableConnector'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { maybeSetupWalletConnectE2eConnect } from '~/playwright/wc/walletConnectE2eConnect'

export function setupWagmiAutoConnect() {
  const params = new URLSearchParams(window.location.search)
  const eagerlyConnectParam = params.get('eagerlyConnect')
  const isEagerlyConnect = eagerlyConnectParam !== 'false'
  const eagerlyConnectAddress = params.get('eagerlyConnectAddress') ?? undefined

  if (!isE2eTestEnv()) {
    return
  }

  // Real WalletConnect connector path (INC-316 / INFRA-2736 e2e) lives in an e2e-only module.
  if (maybeSetupWalletConnectE2eConnect(params)) {
    return
  }

  // Default E2E path: auto-connect the mock connector.
  if (isEagerlyConnect) {
    // setTimeout avoids immediate disconnection caused by race condition in wagmi mock connector
    setTimeout(() => {
      // `eagerlyConnect=embedded` connects the embedded-wallet connector so E2E tests can
      // exercise the passkey/NECK signing path instead of the default mock connector.
      if (eagerlyConnectParam === 'embedded') {
        const embeddedConnector = wagmiConfig.connectors.find(
          (c) => c.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
        )
        if (embeddedConnector) {
          connect(wagmiConfig, { connector: embeddedConnector })
        }
        return
      }
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
