import { ConnectionType } from 'connection'
import { useGetConnection } from 'connection'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'

const SELECTABLE_WALLETS = [
  ConnectionType.UNIWALLET,
  ConnectionType.INJECTED,
  ConnectionType.WALLET_CONNECT,
  ConnectionType.COINBASE_WALLET,
]

export default function useOrderedConnections() {
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  const getConnection = useGetConnection()
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

    return orderedConnectionTypes.map((connectionType) => getConnection(connectionType))
  }, [getConnection, selectedWallet])
}
