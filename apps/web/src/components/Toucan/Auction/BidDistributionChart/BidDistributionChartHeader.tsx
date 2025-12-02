import { MockDataSelectorModal } from 'components/Toucan/Auction/BidDistributionChart/dev/MockDataSelectorModal'
import { BidConcentrationResult } from 'components/Toucan/Auction/BidDistributionChart/utils/bidConcentration'
import { formatTickForDisplay } from 'components/Toucan/Auction/BidDistributionChart/utils/utils'
import { AuctionProgressState, BidTokenInfo, DisplayMode } from 'components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from 'components/Toucan/Auction/store/useAuctionStore'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControl, Text, TouchableArea } from 'ui/src'
import { AnglesMaximize } from 'ui/src/components/icons/AnglesMaximize'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const BidDistributionChartHeaderTooltip = () => {
  const { t } = useTranslation()
  return (
    <InfoTooltip
      placement="top"
      trigger={
        <TouchableArea>
          <QuestionInCircleFilled color="$neutral3" size="$icon.16" />
        </TouchableArea>
      }
      text={
        <Flex gap="$spacing4" p="$padding4">
          <Text variant="body4" color="$neutral1">
            {t('toucan.auction.bidConcentration.tooltip.title')}
          </Text>
          <Text variant="body4" color="$neutral2">
            {t('toucan.auction.bidConcentration.tooltip.description')}
          </Text>
        </Flex>
      }
    />
  )
}

interface BidDistributionChartHeaderProps {
  concentration: BidConcentrationResult | null
  displayMode: DisplayMode
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals?: number
}

export const BidDistributionChartHeader = ({
  concentration,
  displayMode,
  bidTokenInfo,
  totalSupply,
  auctionTokenDecimals = 18,
}: BidDistributionChartHeaderProps) => {
  const { t } = useTranslation()
  const { setDisplayMode, resetChartZoom } = useAuctionStoreActions()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isZoomed = useAuctionStore((state) => state.chartZoomState.isZoomed)
  const auctionState = useAuctionStore((state) => state.progress.state)

  const displayModeOptions = [
    {
      value: DisplayMode.VALUATION,
      display: <Text variant="buttonLabel4">{t('toucan.displayMode.valuation')}</Text>,
    },
    {
      value: DisplayMode.TOKEN_PRICE,
      display: <Text variant="buttonLabel4">{t('toucan.displayMode.tokenPrice')}</Text>,
    },
  ]

  const handleDisplayModeChange = (option: DisplayMode) => {
    setDisplayMode(option)
  }

  // Format concentration range values with user's selected currency
  const formatter = (amount: number): string => {
    return convertFiatAmountFormatted(amount, NumberType.FiatTokenStats)
  }

  const startValue = concentration
    ? formatTickForDisplay({
        tickValue: concentration.startTick,
        displayMode,
        bidTokenInfo,
        totalSupply,
        auctionTokenDecimals,
        formatter,
      })
    : null

  const endValue = concentration
    ? formatTickForDisplay({
        tickValue: concentration.endTick,
        displayMode,
        bidTokenInfo,
        totalSupply,
        auctionTokenDecimals,
        formatter,
      })
    : null

  return (
    <Flex width="100%">
      <Flex row justifyContent="space-between">
        <Flex row alignItems="center" gap="$spacing8">
          <Text variant="body2" color="$neutral2">
            {t('toucan.auction.bidConcentration')}
          </Text>
          <BidDistributionChartHeaderTooltip />
          {/* TODO | Toucan: Remove mock data selector once live */}
          <MockDataSelectorModal bidTokenInfo={bidTokenInfo} />
          {/* Reset zoom button - only visible when chart is zoomed */}
          {isZoomed && (
            <TouchableArea onPress={resetChartZoom}>
              <AnglesMaximize color="$neutral3" size="$icon.16" />
            </TouchableArea>
          )}
        </Flex>
        <SegmentedControl
          options={displayModeOptions}
          selectedOption={displayMode}
          onSelectOption={handleDisplayModeChange}
          size="xsmall"
        />
      </Flex>
      {auctionState === AuctionProgressState.NOT_STARTED ? (
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="heading2" color="$neutral1">
            --
          </Text>
        </Flex>
      ) : concentration && startValue && endValue ? (
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="heading2">{startValue}</Text>
          <Text variant="heading2" color="$neutral3">
            -
          </Text>
          <Text variant="heading2">{endValue}</Text>
        </Flex>
      ) : (
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="body2" color="$neutral3">
            {t('toucan.auction.noConcentration')}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
