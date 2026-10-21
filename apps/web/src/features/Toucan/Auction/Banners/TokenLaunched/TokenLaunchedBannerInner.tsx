import { TouchableArea } from '@universe/mycelium'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getTokenDetailsURL } from '~/data/util'
import { TokenLaunchedBannerContent } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerContent'
import { TokenLaunchedBannerWrapper } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerWrapper'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

interface TokenLaunchedBannerInnerProps {
  tokenName: string
  tokenColor?: string
  tokenTotalSupply?: string
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
  tokenTotalSupply,
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

  const content = (
    <TokenLaunchedBannerContent
      tokenName={tokenName}
      tokenTotalSupply={tokenTotalSupply}
      auctionTokenDecimals={auctionTokenDecimals}
      accentColor={accentColor}
      currentTickValue={priceData?.currentTickValue}
      isTradeAvailable={isTradeAvailable}
      tradeAvailabilityDurationRemaining={tradeAvailabilityDurationRemaining}
      fdvUsdOverride={fdvUsdOverride}
      tokenDetailsAddress={tokenDetailsAddress}
    />
  )

  return (
    <TokenLaunchedBannerWrapper bannerGradient={bannerGradient}>
      {/* Until the token trades there is nowhere to go, and a `TouchableArea` would still read and
          focus as a button, so the banner is only wrapped in one once it leads somewhere. */}
      {canPress ? <TouchableArea onPress={onBannerPress}>{content}</TouchableArea> : content}
    </TokenLaunchedBannerWrapper>
  )
}
