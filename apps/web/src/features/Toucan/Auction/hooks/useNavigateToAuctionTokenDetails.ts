import { useNavigate } from 'react-router'
import { getAuctionLaunchMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { TokenProvenanceAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/data/util'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { buildProvenanceAnalyticsProperties } from '~/features/Toucan/Auction/utils/provenanceAnalytics'
import { usePrefetchTokenDetailsAuction } from '~/pages/TokenDetails/hooks/usePrefetchTokenDetailsAuction'
import { getChainUrlParam } from '~/utils/params/chainParams'

/** One ADP → TDP hand-off for every trade surface: warm the auction lookup, report the click, then navigate. */
export function useNavigateToAuctionTokenDetails({
  enabled,
  entryPoint,
}: {
  enabled: boolean
  entryPoint?: 'auction_now_trading_card' | 'adp_trade_token_banner'
}): {
  prefetchTokenDetails: () => void
  navigateToTokenDetails: () => void
  analyticsProperties: TokenProvenanceAnalyticsProperties | undefined
} {
  const navigate = useNavigate()
  const prefetchAuction = usePrefetchTokenDetailsAuction()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const displayState = useAuctionDisplayState()
  const { tradingTokenAddress } = useAuctionTradingToken({
    chainId: auctionDetails?.chainId,
    tokenAddress: auctionDetails?.tokenAddress,
    enabled,
  })
  const analyticsProperties =
    auctionDetails && displayState
      ? buildProvenanceAnalyticsProperties({
          surface: 'adp',
          chainId: auctionDetails.chainId,
          launchMethod: getAuctionLaunchMethod({ auction: auctionDetails }),
          phase: displayState.phase,
          poolAvailability: displayState.poolAvailability,
          // The TDP reports its own page token, so a receipt-token auction reports the underlying one it trades as.
          tokenAddress: tradingTokenAddress ?? auctionDetails.tokenAddress,
          auctionAddress: auctionDetails.address,
          entry_point: entryPoint,
        })
      : undefined

  const prefetchTokenDetails = useEvent(() => {
    if (auctionDetails && tradingTokenAddress) {
      prefetchAuction({ chainId: auctionDetails.chainId, tokenAddress: tradingTokenAddress })
    }
  })

  const navigateToTokenDetails = useEvent(() => {
    if (!auctionDetails || !tradingTokenAddress) {
      return
    }
    prefetchTokenDetails()
    // The event needs the flag-gated display state; navigation never waits on analytics.
    if (analyticsProperties) {
      sendAnalyticsEvent(AuctionEventName.AuctionDetailsToTokenDetailsClicked, analyticsProperties)
    }
    navigate(
      getTokenDetailsURL({
        address: tradingTokenAddress,
        chainUrlParam: getChainUrlParam(auctionDetails.chainId),
      }),
    )
  })
  return { prefetchTokenDetails, navigateToTokenDetails, analyticsProperties }
}
