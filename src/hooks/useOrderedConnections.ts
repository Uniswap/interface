import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { useMemo } from 'react'

const SELECTABLE_WALLETS = [
  ConnectionType.UNISWAP_WALLET_V2,
  ConnectionType.INJECTED,
  ConnectionType.WALLET_CONNECT_V2,
  ConnectionType.COINBASE_WALLET,
]

export default function useOrderedConnections() {
  return useMemo(() => {
    const orderedConnectionTypes: ConnectionType[] = []

    // Always attempt to use to Gnosis Safe first, as we can't know if we're in a SafeContext.
    orderedConnectionTypes.push(ConnectionType.GNOSIS_SAFE)

    orderedConnectionTypes.push(...SELECTABLE_WALLETS)

    // Add network connection last as it should be the fallback.
    orderedConnectionTypes.push(ConnectionType.NETWORK)

    return orderedConnectionTypes.map((connectionType) => getConnection(connectionType))
  }, [])
}
