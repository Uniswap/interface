import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Flex, TouchableArea } from 'ui/src'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { TokenLaunchedBackgroundChart } from '~/components/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBackgroundChart'
import { TokenLaunchedBannerContent } from '~/components/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerContent'
import { TokenLaunchedBannerWrapper } from '~/components/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerWrapper'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'

const BACKGROUND_CHART_HEIGHT = 90
const BACKGROUND_CHART_WIDTH = 240
const BACKGROUND_CHART_OPACITY = 0.8

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
  scrimStyle: { backgroundImage: string }
  accentColor: string
}

export function TokenLaunchedBannerInner({
  tokenName,
  totalSupply,
  auctionTokenDecimals,
  priceData,
  bannerGradient,
  scrimStyle,
  accentColor,
}: TokenLaunchedBannerInnerProps) {
  const navigate = useNavigate()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  // Only show background chart if there's chart data
  const hasChartData = priceData && priceData.priceSeries.length > 0

  const onBannerPress = useCallback(() => {
    if (!auctionDetails) {
      return
    }
    const tokenDetailsURL = getTokenDetailsURL({
      address: auctionDetails.tokenAddress,
      chain: toGraphQLChain(auctionDetails.chainId),
    })
    navigate(tokenDetailsURL)
  }, [auctionDetails, navigate])

  const isDisabled = !auctionDetails

  return (
    <TokenLaunchedBannerWrapper bannerGradient={bannerGradient}>
      <TouchableArea onPress={onBannerPress} disabled={isDisabled} cursor={isDisabled ? 'default' : 'pointer'}>
        <Flex position="absolute" inset={0} pointerEvents="none" style={scrimStyle} />
        {hasChartData && (
          <>
            <Flex
              position="absolute"
              right="$spacing24"
              top="$spacing8"
              width={BACKGROUND_CHART_WIDTH}
              pointerEvents="none"
              opacity={BACKGROUND_CHART_OPACITY}
            >
              <TokenLaunchedBackgroundChart
                series={priceData.priceSeries}
                strokeColor={accentColor}
                height={BACKGROUND_CHART_HEIGHT}
              />
            </Flex>
          </>
        )}
        <TokenLaunchedBannerContent
          tokenName={tokenName}
          totalSupply={totalSupply}
          auctionTokenDecimals={auctionTokenDecimals}
          accentColor={accentColor}
          currentTickValue={priceData?.currentTickValue}
          changePercentage={priceData?.changePercentage}
        />
      </TouchableArea>
    </TokenLaunchedBannerWrapper>
  )
}
