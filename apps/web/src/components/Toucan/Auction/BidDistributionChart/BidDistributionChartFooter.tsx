import { BlockUpdateCountdown } from 'components/Toucan/Auction/BidDistributionChart/BlockUpdateCountdown'
import { BidConcentrationResult } from 'components/Toucan/Auction/BidDistributionChart/utils/bidConcentration'
import { AuctionProgressState } from 'components/Toucan/Auction/store/types'
import { useAuctionStore } from 'components/Toucan/Auction/store/useAuctionStore'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'

const ColorDot = styled(Flex, {
  width: 8,
  height: 8,
  borderRadius: '$roundedFull',
})

const HorizontalLine = styled(Flex, {
  width: '100%',
  height: 1,
  backgroundColor: '$surface3',
})

interface BidDistributionChartFooterProps {
  concentration: BidConcentrationResult | null
  chainId: EVMUniverseChainId | undefined
}

export const BidDistributionChartFooter = ({ concentration, chainId }: BidDistributionChartFooterProps) => {
  const { t } = useTranslation()
  const tokenColor = useAuctionStore((state) => state.tokenColor)
  const auctionState = useAuctionStore((state) => state.progress.state)

  // Hide concentration percentage when auction hasn't started
  const shouldShowConcentration = auctionState !== AuctionProgressState.NOT_STARTED && concentration

  return (
    <Flex width="100%" mt={-5}>
      <HorizontalLine />
      <Flex
        row
        justifyContent={shouldShowConcentration ? 'space-between' : 'flex-end'}
        alignItems="center"
        mt="$spacing8"
      >
        {shouldShowConcentration ? (
          <Flex row alignItems="center" gap={2}>
            <ColorDot backgroundColor={tokenColor} />
            <Text variant="body4" color="$neutral2" ml="$spacing4">
              {t('toucan.auction.bidVolume', { percentage: Math.round(concentration.percentage * 100) })}
            </Text>
          </Flex>
        ) : null}
        <BlockUpdateCountdown chainId={chainId} />
      </Flex>
    </Flex>
  )
}
