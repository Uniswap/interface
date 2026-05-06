import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControl, Text, Tooltip, useColorsFromTokenColor, useSporeColors } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { BidDistributionChartTab } from '~/features/Toucan/Auction/AuctionChartShared'
import { AuctionProgressBar } from '~/features/Toucan/Auction/AuctionProgressBar'
import { AuctionChartZoomControls } from '~/features/Toucan/Auction/BidDistributionChart/AuctionChartZoomControls'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { computeTotalClearedFraction } from '~/features/Toucan/Auction/utils/computeTotalClearedFraction'
import { getChartBarColors } from '~/features/Toucan/ToucanChart/utils/colors'

interface LegendDotProps {
  color: string
}

interface LegendDotOutlineProps {
  color: string
}

interface ChartFooterProps {
  activeTab: BidDistributionChartTab
  groupingToggleDisabled?: boolean
  /** V2 combined chart mode: show legend on left, zoom on right */
  combinedMode?: boolean
  onLearnMorePress?: () => void
}

type GroupingOption = 'grouped' | 'ungrouped'

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
 * Used by both ClearingPriceChart and BidDistributionChart tabs.
 */
export const ChartFooter = ({
  activeTab,
  groupingToggleDisabled = false,
  combinedMode = false,
  onLearnMorePress,
}: ChartFooterProps) => {
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const concentrationPercentageForTooltip = useAuctionStore((state) => state.concentrationBand?.percentage)

  const {
    auctionDetails,
    checkpointData,
    tokenColor,
    progress,
    groupTicksEnabled,
    concentrationBand,
    chartZoomStates,
    clearingPriceZoomState,
  } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    tokenColor: state.tokenColor,
    progress: state.progress,
    groupTicksEnabled: state.groupTicksEnabled,
    concentrationBand: state.concentrationBand,
    chartZoomStates: state.chartZoomStates,
    clearingPriceZoomState: state.clearingPriceZoomState,
  }))
  const { setGroupTicksEnabled, requestChartZoom } = useAuctionStoreActions()
  const { tokenColor: auctionTokenColor, tokenColorLoading } = useAuctionTokenColor()
  const hasConcentration = concentrationBand !== null

  const { validTokenColor } = useColorsFromTokenColor(tokenColor)
  // Calculate progress as fraction of tokens cleared (totalCleared / auctionAmount)
  const progressPercentage = computeTotalClearedFraction({
    totalCleared: checkpointData?.totalCleared,
    auctionAmount: auctionDetails?.amount,
  })
  const percentSoldLabel = useMemo(() => formatPercent(progressPercentage * 100), [formatPercent, progressPercentage])

  const legendItems = useMemo(() => {
    const barColors = getChartBarColors({
      tokenColor: auctionTokenColor,
      fallbackAccentColor: tokenColorLoading ? colors.neutral3.val : colors.accent1.val,
      neutralColor: colors.neutral3.val,
    })

    // Format concentration percentage for tooltip (percentage is 0-1, formatPercent expects 0-100)
    // Round to whole number for cleaner display (e.g., 80% instead of 80.77%)
    const concentrationTooltip =
      concentrationPercentageForTooltip !== undefined
        ? t('toucan.bidDistribution.legend.concentrationTooltip', {
            percentage: formatPercent(Math.round(concentrationPercentageForTooltip * 100)),
          })
        : undefined

    return [
      {
        color: barColors.belowClearingPriceColor,
        label: t('toucan.bidDistribution.legend.outOfRange'),
        tooltipContent: undefined,
      },
      {
        color: barColors.concentrationColor,
        label: t('toucan.bidDistribution.legend.bidConcentration'),
        tooltipContent: concentrationTooltip,
      },
    ]
  }, [
    auctionTokenColor,
    colors.accent1.val,
    colors.neutral3.val,
    concentrationPercentageForTooltip,
    formatPercent,
    t,
    tokenColorLoading,
  ])

  const isClearingPriceActive = activeTab === BidDistributionChartTab.ClearingPrice
  const isDistributionActive = activeTab === BidDistributionChartTab.Distribution
  const isAuctionInProgress = progress.state === AuctionProgressState.IN_PROGRESS
  // Hide zoom controls only for clearing price chart during in-progress auctions
  const hideZoomForInProgressClearingPrice = isClearingPriceActive && isAuctionInProgress
  const showZoomControls = combinedMode || !hideZoomForInProgressClearingPrice
  const isZoomDisabled = !isClearingPriceActive && isDistributionActive && groupTicksEnabled

  // In combined mode, the CombinedAuctionChart owns zoom state via clearingPriceZoomState
  const isCombinedChartActive = combinedMode && !isClearingPriceActive && activeTab !== BidDistributionChartTab.Demand
  let activeZoomState = clearingPriceZoomState
  if (!isClearingPriceActive && !isCombinedChartActive) {
    activeZoomState = isDistributionActive ? chartZoomStates.distribution : chartZoomStates.demand
  }

  const zoomTarget = isClearingPriceActive || isCombinedChartActive ? 'clearingPrice' : activeTab

  const handleZoomIn = () => {
    requestChartZoom(zoomTarget, 'zoomIn')
  }

  const handleZoomOut = () => {
    requestChartZoom(zoomTarget, 'zoomOut')
  }

  const handleResetZoom = () => {
    requestChartZoom(zoomTarget, 'reset')
  }

  const handleGroupingChange = (option: GroupingOption) => {
    setGroupTicksEnabled(option === 'grouped')
  }

  const groupingOptions = useMemo(
    () =>
      [
        {
          value: 'grouped',
          display: <Text variant="buttonLabel4">{t('toucan.bidDistribution.grouped')}</Text>,
        },
        {
          value: 'ungrouped',
          display: <Text variant="buttonLabel4">{t('toucan.bidDistribution.ungrouped')}</Text>,
        },
      ] as const,
    [t],
  )

  const combinedLegendColor = auctionTokenColor ?? colors.accent1.val

  return (
    <Flex width="100%" mt={-15}>
      <Flex row alignItems="center" justifyContent="space-between" pt="$spacing6" height={34}>
        {combinedMode ? (
          <>
            <Flex row alignItems="center" gap="$spacing16" $sm={{ display: 'none' }}>
              <Flex row alignItems="center" gap="$spacing6">
                <LegendDot color={combinedLegendColor} />
                <Text variant="body4" color="$neutral2">
                  {t('toucan.bidDistribution.legend.tokenPrice')}
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
            </Flex>
            <Flex row alignItems="center">
              {showZoomControls && (
                <AuctionChartZoomControls
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onReset={handleResetZoom}
                  isZoomDisabled={isZoomDisabled}
                  isResetDisabled={!activeZoomState.isZoomed}
                />
              )}
            </Flex>
          </>
        ) : (
          <>
            <Flex row alignItems="center" gap="$spacing12">
              {isDistributionActive && !groupingToggleDisabled && (
                <SegmentedControl
                  options={groupingOptions}
                  selectedOption={groupTicksEnabled ? 'grouped' : 'ungrouped'}
                  onSelectOption={handleGroupingChange}
                  size="xsmall"
                />
              )}
              {showZoomControls && (
                <AuctionChartZoomControls
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onReset={handleResetZoom}
                  isZoomDisabled={isZoomDisabled}
                  isResetDisabled={!activeZoomState.isZoomed}
                />
              )}
            </Flex>
            {isDistributionActive && hasConcentration ? (
              <Flex row alignItems="center" gap="$spacing12" $sm={{ display: 'none' }}>
                {legendItems.map(({ color, label, tooltipContent }) => {
                  const legendContent = (
                    <Flex key={label} row alignItems="center" gap="$spacing4">
                      <LegendDot color={color} />
                      <Text variant="body4" color="$neutral2">
                        {label}
                      </Text>
                    </Flex>
                  )

                  if (tooltipContent) {
                    return (
                      <Tooltip key={label} placement="top" delay={75} offset={{ mainAxis: 8 }}>
                        <Tooltip.Trigger cursor="default">{legendContent}</Tooltip.Trigger>
                        <Tooltip.Content
                          backgroundColor="$surface1"
                          borderRadius="$rounded12"
                          borderWidth="$spacing1"
                          borderColor="$surface3"
                          py="$spacing8"
                          px="$spacing12"
                          zIndex="$tooltip"
                        >
                          <Text variant="body4" color="$neutral2">
                            {tooltipContent}
                          </Text>
                        </Tooltip.Content>
                      </Tooltip>
                    )
                  }

                  return legendContent
                })}
              </Flex>
            ) : (
              <Flex />
            )}
          </>
        )}
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
