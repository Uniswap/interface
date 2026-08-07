import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import type { Register } from 'wagmi'

type WagmiConnector = Register['config']['connectors'][number]

/**
 * Which EVM connectors the app should reconnect on mount. Empty means reconnect nothing.
 * Gated on the app-owned recentConnectorId record (cleared by "clear site data"), plus a
 * Safe carve-out: Safe iframe sessions only ever connect via reconnect and never write a
 * recentConnectorId, so we reconnect the Safe connector whenever running framed.
 */
export function getConnectorsToReconnect(params: {
  recentConnectorId: string | undefined
  isIframe: boolean
  connectors: readonly WagmiConnector[]
}): WagmiConnector[] {
  const { recentConnectorId, isIframe, connectors } = params
  const result: WagmiConnector[] = []

  if (recentConnectorId) {
    const recent = connectors.find((connector) => connector.id === recentConnectorId)
    if (recent) {
      result.push(recent)
    }
  }

  if (isIframe) {
    const safe = connectors.find((connector) => connector.id === CONNECTION_PROVIDER_IDS.SAFE_CONNECTOR_ID)
    if (safe && !result.includes(safe)) {
      result.push(safe)
    }
  }

  return result
}

// Flips true once the mount reconnect attempt has run, so the accounts store can report the
// pending reconnect synchronously on the first render (before the effect fires) and then stop.
let settled = false
const listeners = new Set<() => void>()

export function getMountReconnectSettled(): boolean {
  return settled
}

export function subscribeMountReconnectSettled(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function settleMountReconnect(): void {
  if (settled) {
    return
  }
  settled = true
  listeners.forEach((listener) => listener())
}
