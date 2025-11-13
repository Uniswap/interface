import { BidDistributionChartFooter } from 'components/Toucan/Auction/BidDistributionChart/BidDistributionChartFooter'
import { BidDistributionChartHeader } from 'components/Toucan/Auction/BidDistributionChart/BidDistributionChartHeader'
import { BidDistributionChartRenderer } from 'components/Toucan/Auction/BidDistributionChart/BidDistributionChartRenderer'
import { generateChartData } from 'components/Toucan/Auction/BidDistributionChart/utils/utils'
import { useBidTokenInfo } from 'components/Toucan/Auction/hooks/useBidTokenInfo'
import { FAKE_AUCTION_DATA } from 'components/Toucan/Auction/store/mockData'
import { useMockDataStore } from 'components/Toucan/Auction/store/mocks/useMockDataStore'
import { useAuctionStore } from 'components/Toucan/Auction/store/useAuctionStore'
import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'

export const BidDistributionChart = () => {
  const { displayMode, tokenColor } = useAuctionStore((state) => ({
    displayMode: state.displayMode,
    tokenColor: state.tokenColor,
  }))
  // TODO | Toucan: Remove mock data store usage once live
  const { selectedDataset, selectedDatasetIndex, bidTokenAddress, tickSize, clearingPrice, totalSupply } =
    useMockDataStore()

  const {
    bidTokenInfo,
    loading: bidTokenLoading,
    error: bidTokenError,
  } = useBidTokenInfo(bidTokenAddress, FAKE_AUCTION_DATA.chainId)

  // Calculate chart data once - shared between header and renderer
  // Use a simple formatter here since the renderer will apply proper formatting
  const chartData = useMemo(
    () =>
      bidTokenInfo
        ? generateChartData({
            bidData: selectedDataset,
            bidTokenInfo,
            displayMode,
            totalSupply,
            auctionTokenDecimals: FAKE_AUCTION_DATA.tokenDecimals,
            clearingPrice,
            tickSize,
            formatter: (amount: number) => amount.toString(),
          })
        : null,
    [displayMode, selectedDataset, bidTokenInfo, clearingPrice, tickSize, totalSupply],
  )

  // TODO | Toucan - get error state from design + add translation
  // Show error state if bid token info fetch failed
  if (bidTokenError) {
    logger.error(bidTokenError, {
      tags: { file: 'BidDistributionChart', function: 'useBidTokenInfo' },
      extra: { bidTokenAddress, chainId: FAKE_AUCTION_DATA.chainId },
    })
    return (
      <Flex maxWidth={780} width="62%" gap="$spacing16" alignItems="center" justifyContent="center" py="$spacing48">
        <Text variant="body2" color="$statusCritical">
          Failed to load bid token data
        </Text>
      </Flex>
    )
  }

  // TODO | Toucan - get loading state from design + add translation
  // Show loading state while fetching bid token info
  if (bidTokenLoading || !bidTokenInfo || !chartData) {
    return (
      <Flex maxWidth={780} width="62%" gap="$spacing16" alignItems="center" justifyContent="center" py="$spacing48">
        <Text variant="body2" color="$neutral2">
          Loading bid token data...
        </Text>
      </Flex>
    )
  }

  return (
    <Flex maxWidth={780} width="62%" gap="$spacing16">
      <BidDistributionChartHeader
        concentration={chartData.concentration}
        displayMode={displayMode}
        bidTokenInfo={bidTokenInfo}
        totalSupply={totalSupply}
        auctionTokenDecimals={FAKE_AUCTION_DATA.tokenDecimals}
      />
      <BidDistributionChartRenderer
        key={`${selectedDatasetIndex}-${displayMode}`}
        bidData={selectedDataset}
        bidTokenInfo={bidTokenInfo}
        displayMode={displayMode}
        totalSupply={totalSupply}
        auctionTokenDecimals={FAKE_AUCTION_DATA.tokenDecimals}
        clearingPrice={clearingPrice}
        tickSize={tickSize}
        tokenColor={tokenColor}
        preCalculatedConcentration={chartData.concentration}
      />
      <BidDistributionChartFooter
        concentration={chartData.concentration}
        chainId={FAKE_AUCTION_DATA.chainId as EVMUniverseChainId}
      />
    </Flex>
  )
}
