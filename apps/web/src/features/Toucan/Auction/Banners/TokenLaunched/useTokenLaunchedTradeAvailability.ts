import type { EVMUniverseChainId } from '@universe/chains'
import { PoolAvailability, resolvePoolAvailability } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { isTokenLaunchTradeLive } from '~/features/Toucan/Auction/utils/tokenLaunchedBannerUtils'
import { useTokenPoolState } from '~/hooks/useTokenPoolState'

export function useTokenLaunchedTradeAvailability({
  chainId,
  realTokenAddress,
  isRedeemable,
  isGraduated,
  isTradeAvailableFromStatus,
  tradingRestrictedUntilTge,
  hasMarketPrice,
}: {
  chainId: EVMUniverseChainId | undefined
  realTokenAddress: string | undefined
  isRedeemable: boolean
  isGraduated: boolean
  isTradeAvailableFromStatus: boolean
  tradingRestrictedUntilTge: boolean
  hasMarketPrice: boolean
}): { isTradeAvailable: boolean; loading: boolean } {
  // The query gate and the eligibility rule are one predicate on purpose: these are the conditions that
  // make the trade available, and the pool read only confirms the last of them. A condition added here
  // purely to skip a fetch would silently withdraw "Trade now".
  const isRedeemableTradeEligible =
    isRedeemable &&
    isGraduated &&
    isTradeAvailableFromStatus &&
    !tradingRestrictedUntilTge &&
    Boolean(realTokenAddress) &&
    chainId !== undefined
  const { poolState } = useTokenPoolState({
    chainId,
    tokenAddress: realTokenAddress,
    enabled: isRedeemableTradeEligible,
  })

  // CAP has filtered pools while GraphQL reports a zero price. Ordinary auctions still need a live market price.
  const isTradeAvailable = isRedeemable
    ? isRedeemableTradeEligible && resolvePoolAvailability(poolState) === PoolAvailability.HasPool
    : isTokenLaunchTradeLive({ isTradeAvailableFromStatus, hasLiveMarketPrice: hasMarketPrice })

  return { isTradeAvailable, loading: isRedeemableTradeEligible && poolState.status === 'loading' }
}
