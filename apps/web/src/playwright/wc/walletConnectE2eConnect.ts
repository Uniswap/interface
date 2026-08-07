import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { connect } from 'wagmi/actions'
import { wagmiConfig } from '~/connection/wagmiConfig'

// e2e-only: drives the REAL interfaceWalletConnect connector over the hermetic local relay
// (INC-316 / INFRA-2736), kept out of the production auto-connect entry so no test code lives
// there. `?wcConnect=true` selects this path; the interface's display_uri is surfaced on window
// so the test's wallet counterparty can pair with it. Reuses the single registered connector
// (which the e2e config points at the local relay) — a second same-namespace SignClient would
// share a relay identity and break pairing (the INC-316 failure this harness guards against).
const WC_E2E_CONNECT_PARAM = 'wcConnect'

interface WcE2eWindow {
  __WC_DISPLAY_URI__?: string
}

/** Handles the WalletConnect e2e connect path when requested. Returns true when it did. */
export function maybeSetupWalletConnectE2eConnect(params: URLSearchParams): boolean {
  if (params.get(WC_E2E_CONNECT_PARAM) !== 'true') {
    return false
  }

  const connector = wagmiConfig.connectors.find((c) => c.id === CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID)
  if (!connector) {
    return true
  }

  connector.emitter.on('message', (payload) => {
    if (payload.type === 'display_uri' && typeof payload.data === 'string') {
      ;(window as unknown as WcE2eWindow).__WC_DISPLAY_URI__ = payload.data
    }
  })

  connect(wagmiConfig, { connector }).catch(() => {
    // Connection errors surface as a failed assertion in the test; nothing to do here.
  })

  return true
}
