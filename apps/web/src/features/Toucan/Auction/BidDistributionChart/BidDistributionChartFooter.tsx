import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useColorsFromTokenColor, useSporeColors } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { BidDistributionChartTab } from '~/features/Toucan/Auction/AuctionChartShared'
import { AuctionProgressBar } from '~/features/Toucan/Auction/AuctionProgressBar'
import { AuctionChartZoomControls } from '~/features/Toucan/Auction/BidDistributionChart/AuctionChartZoomControls'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { computeTotalClearedFraction } from '~/features/Toucan/Auction/utils/computeTotalClearedFraction'

interface LegendDotProps {
  color: string
}

interface LegendDotOutlineProps {
  color: string
}

interface ChartFooterProps {
  activeTab: BidDistributionChartTab
  onLearnMorePress?: () => void
}

const LegendDot = ({ color }: LegendDotProps) => (
  <Flex width="$spacing8" height="$spacing8" borderRadius="$roundedFull" backgroundColor={color} />
)

const LegendDotDashed = ({ color }: LegendDotOutlineProps) => (
  <svg width={9} height={9} viewBox="0 0 9 9" fill="none">
    <circle cx={4.5} cy={4.5} r={4} stroke={color} strokeDasharray="1 1" />
  </svg>
)

/**
 * Shared chart footer component displaying auction progress.
 * Used by combined chart and demand chart tabs.
 */
export const ChartFooter = ({ activeTab, onLearnMorePress }: ChartFooterProps) => {
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()
  const colors = useSporeColors()

  const {
    auctionDetails,
    totalCleared,
    tokenColor,
    concentrationBand,
    chartZoomStates,
    clearingPriceZoomState,
    tickDetails,
    isBidInputFocused,
  } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    totalCleared: state.totalCleared,
    tokenColor: state.tokenColor,
    concentrationBand: state.concentrationBand,
    chartZoomStates: state.chartZoomStates,
    clearingPriceZoomState: state.clearingPriceZoomState,
    tickDetails: state.tickDetails,
    isBidInputFocused: state.isBidInputFocused,
  }))
  const { requestChartZoom } = useAuctionStoreActions()
  const { tokenColor: auctionTokenColor } = useAuctionTokenColor()
  // Match the chart: the concentration lines only render while a bid input is focused.
  const hasConcentration = concentrationBand !== null && isBidInputFocused

  const { validTokenColor } = useColorsFromTokenColor(tokenColor)
  // Calculate progress as fraction of tokens cleared (totalCleared / auctionAmount)
  const progressPercentage = computeTotalClearedFraction({
    totalCleared: totalCleared ?? undefined,
    auctionAmount: auctionDetails?.amount,
  })
  const percentSoldLabel = useMemo(() => formatPercent(progressPercentage * 100), [formatPercent, progressPercentage])

  const isClearingPriceActive = activeTab === BidDistributionChartTab.ClearingPrice

  // In combined mode, the CombinedAuctionChart owns zoom state via clearingPriceZoomState.
  // The Demand tab uses its own zoom state.
  const activeZoomState = isClearingPriceActive ? clearingPriceZoomState : chartZoomStates.demand
  const zoomTarget = isClearingPriceActive ? 'clearingPrice' : activeTab

  const handleZoomIn = () => {
    requestChartZoom(zoomTarget, 'zoomIn')
  }

  const handleZoomOut = () => {
    requestChartZoom(zoomTarget, 'zoomOut')
  }

  const handleResetZoom = () => {
    requestChartZoom(zoomTarget, 'reset')
  }

  const combinedLegendColor = auctionTokenColor ?? colors.accent1.val
  const isDemandTab = activeTab === BidDistributionChartTab.Demand
  const hasFillColoring = (tickDetails?.length ?? 0) > 0

  return (
    <Flex width="100%" mt={-15}>
      <Flex row alignItems="center" justifyContent="space-between" pt="$spacing6" height={34}>
        <Flex row alignItems="center" gap="$spacing16" $sm={{ display: 'none' }}>
          {isDemandTab ? (
            <>
              <Flex row alignItems="center" gap="$spacing6">
                <LegendDot color={combinedLegendColor} />
                <Text variant="body4" color="$neutral2">
                  {hasFillColoring
                    ? t('toucan.bidDistribution.legend.filled')
                    : t('toucan.bidDistribution.legend.inRange')}
                </Text>
              </Flex>
              <Flex row alignItems="center" gap="$spacing6">
                <LegendDot color={colors.neutral3.val} />
                <Text variant="body4" color="$neutral2">
                  {hasFillColoring
                    ? t('toucan.bidDistribution.legend.remaining')
                    : t('toucan.bidDistribution.legend.outOfRange')}
                </Text>
              </Flex>
            </>
          ) : (
            <>
              <Flex row alignItems="center" gap="$spacing6">
                <LegendDot color={combinedLegendColor} />
                <Text variant="body4" color="$neutral2">
                  {t('toucan.bidDistribution.legend.tokenPrice')}
                </Text>
              </Flex>
              <Flex row alignItems="center" gap="$spacing6">
                <LegendDotDashed color={combinedLegendColor} />
                <Text variant="body4" color="$neutral2">
                  {t('toucan.bidDistribution.legend.preBidPrice')}
                </Text>
              </Flex>
              <Flex row alignItems="center" gap="$spacing6">
                <LegendDot color={colors.neutral2.val} />
                <Text variant="body4" color="$neutral2">
                  {t('toucan.bidDistribution.legend.bidDistribution')}
                </Text>
              </Flex>
              {hasConcentration && (
                <Flex row alignItems="center" gap="$spacing6">
                  <LegendDotDashed color={colors.neutral3.val} />
                  <Text variant="body4" color="$neutral2">
                    {t('toucan.bidDistribution.legend.bidConcentration')}
                  </Text>
                </Flex>
              )}
            </>
          )}
        </Flex>
        <Flex row alignItems="center">
          <AuctionChartZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetZoom}
            isResetDisabled={!activeZoomState.isZoomed}
          />
        </Flex>
      </Flex>
      <Flex my="$spacing16" pt="$spacing4" gap="$gap12" $sm={{ my: '$none', mt: '$spacing8' }}>
        <AuctionProgressBar percentage={progressPercentage} color={validTokenColor} />
        <Flex
          row
          justifyContent="space-between"
          onPress={onLearnMorePress}
          cursor={onLearnMorePress ? 'pointer' : undefined}
        >
          <Text variant="body4" color="$neutral2" hoverStyle={{ color: onLearnMorePress ? '$neutral1' : '$neutral2' }}>
            {percentSoldLabel} {t('toucan.auction.ofSupplySold')}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
