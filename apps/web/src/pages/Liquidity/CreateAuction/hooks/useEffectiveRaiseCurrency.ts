import type { RaiseCurrency } from '~/features/Toucan/utils/raiseCurrency'
import { useCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useLaunchChainId } from '~/pages/Liquidity/CreateAuction/hooks/useLaunchChainId'
import { getEffectiveRaiseCurrency } from '~/pages/Liquidity/CreateAuction/utils'

/**
 * The raise currency the auction is actually created with: the stored selection resolved against
 * the chain being launched on. The picker is hidden where both raise options are the same asset,
 * so a selection carried over from another chain has to resolve wherever it is read — and every
 * step has to resolve against the same chain, or their analytics events disagree with each other.
 *
 * Read the raise currency through this hook rather than `state.configureAuction.raiseCurrency`,
 * which is only what the user picked. Derived per render, like the store reads it replaces.
 *
 * Resolved against `useLaunchChainId` — the same chain every step hands to the components that
 * price and denominate in the raise currency, so the resolved currency and the chain it is
 * resolved on can't disagree.
 */
export function useEffectiveRaiseCurrency(): RaiseCurrency {
  const launchChainId = useLaunchChainId()
  const selectedRaiseCurrency = useCreateAuctionStore((state) => state.configureAuction.raiseCurrency)

  return getEffectiveRaiseCurrency(selectedRaiseCurrency, launchChainId)
}
