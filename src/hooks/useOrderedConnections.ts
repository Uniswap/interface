import { ConnectionType } from 'connection'
import { getConnection } from 'connection/utils'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'

const SELECTABLE_WALLETS = [ConnectionType.INJECTED, ConnectionType.COINBASE_WALLET, ConnectionType.WALLET_CONNECT]

export default function useOrderedConnections() {
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  return useMemo(() => {
    const orderedConnectionTypes: ConnectionType[] = []

    // Always attempt to use to Gnosis Safe first, as we can't know if we're in a SafeContext.
    orderedConnectionTypes.push(ConnectionType.GNOSIS_SAFE)

    // Add the `selectedWallet` to the top so it's prioritized, then add the other selectable wallets.
    if (selectedWallet) {
      orderedConnectionTypes.push(selectedWallet)
    }
    orderedConnectionTypes.push(...SELECTABLE_WALLETS.filter((wallet) => wallet !== selectedWallet))

    // Add network connection last as it should be the fallback.
    orderedConnectionTypes.push(ConnectionType.NETWORK)

    return orderedConnectionTypes.map(getConnection)
  }, [selectedWallet])
}
