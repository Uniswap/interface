import { DisplayMode } from 'components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from 'components/Toucan/Auction/store/useAuctionStore'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControl, Text, TouchableArea } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'

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

export const BidDistributionChartHeader = () => {
  const { t } = useTranslation()
  const { displayMode } = useAuctionStore((state) => ({
    displayMode: state.displayMode,
  }))
  const { setDisplayMode } = useAuctionStoreActions()

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

  return (
    <Flex width="100%">
      <Flex row justifyContent="space-between">
        <Flex row alignItems="center">
          <Text variant="body2" color="$neutral2" mr="$spacing4">
            {t('toucan.auction.bidConcentration')}
          </Text>
          <BidDistributionChartHeaderTooltip />
        </Flex>
        <SegmentedControl
          options={displayModeOptions}
          selectedOption={displayMode}
          onSelectOption={handleDisplayModeChange}
          size="xsmall"
        />
      </Flex>
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="heading2">$1.0M</Text>
        <Text variant="heading2" color="$neutral3">
          -
        </Text>
        <Text variant="heading2">$2.5M</Text>
      </Flex>
    </Flex>
  )
}
