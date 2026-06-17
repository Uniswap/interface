import { useEffect } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'

/**
 * Keeps the create-new-token selected network in sync with the allowed networks. When testnet mode
 * toggles, the allowed list is re-partitioned (see `filterAllowedNetworksByTestnetMode`), which can
 * leave the stored selection (e.g. the default Unichain) pointing at a chain that's no longer
 * offered. This snaps it back to the first allowed chain so the picker, its trigger label, and the
 * submitted auction all agree on a valid network.
 */
export function useReconcileCreateNewTokenNetwork({
  selectedNetwork,
  allowedNetworks,
}: {
  selectedNetwork: UniverseChainId
  allowedNetworks: UniverseChainId[]
}): void {
  const { updateCreateNewTokenField } = useCreateAuctionStoreActions()

  useEffect(() => {
    if (allowedNetworks.length > 0 && !allowedNetworks.includes(selectedNetwork)) {
      updateCreateNewTokenField('network', allowedNetworks[0])
    }
  }, [allowedNetworks, selectedNetwork, updateCreateNewTokenField])
}
