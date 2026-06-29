import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { TouchableArea } from 'ui/src'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { TokenLaunchedBannerContent } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerContent'
import { TokenLaunchedBannerWrapper } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerWrapper'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

interface TokenLaunchedBannerInnerProps {
  tokenName: string
  tokenColor?: string
  totalSupply?: string
  auctionTokenDecimals: number
  priceData?: {
    priceSeries: Array<{ timestamp: number; value: number }>
    currentTickValue: number
    changePercentage?: number // Optional - undefined when using clearing price fallback
  }
  bannerGradient: { backgroundImage: string; backgroundSize: string }
  accentColor: string
  isTradeAvailable: boolean
  tradeAvailabilityDurationRemaining: string | undefined
  // See TokenLaunchedBannerContent — set for redeemable virtual tokens to present the real token.
  fdvUsdOverride?: number | null
  tokenDetailsAddress?: string
}

export function TokenLaunchedBannerInner({
  tokenName,
  totalSupply,
  auctionTokenDecimals,
  priceData,
  bannerGradient,
  accentColor,
  isTradeAvailable,
  tradeAvailabilityDurationRemaining,
  fdvUsdOverride,
  tokenDetailsAddress,
}: TokenLaunchedBannerInnerProps) {
  const navigate = useNavigate()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  const onBannerPress = useCallback(() => {
    if (!auctionDetails) {
      return
    }
    const tokenDetailsURL = getTokenDetailsURL({
      address: tokenDetailsAddress ?? auctionDetails.tokenAddress,
      chain: toGraphQLChain(auctionDetails.chainId),
    })
    navigate(tokenDetailsURL)
  }, [auctionDetails, navigate, tokenDetailsAddress])

  const canPress = Boolean(auctionDetails && isTradeAvailable)

  return (
    <TokenLaunchedBannerWrapper bannerGradient={bannerGradient}>
      <TouchableArea onPress={canPress ? onBannerPress : undefined} cursor={canPress ? 'pointer' : 'default'}>
        <TokenLaunchedBannerContent
          tokenName={tokenName}
          totalSupply={totalSupply}
          auctionTokenDecimals={auctionTokenDecimals}
          accentColor={accentColor}
          currentTickValue={priceData?.currentTickValue}
          isTradeAvailable={isTradeAvailable}
          tradeAvailabilityDurationRemaining={tradeAvailabilityDurationRemaining}
          fdvUsdOverride={fdvUsdOverride}
          tokenDetailsAddress={tokenDetailsAddress}
        />
      </TouchableArea>
    </TokenLaunchedBannerWrapper>
  )
}
