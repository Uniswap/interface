import { Flex } from '@universe/mycelium'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InterfaceEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { refitChartContentAtom } from '~/components/Charts/ChartModel'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import {
  DropdownSelector,
  type SelectOption,
  SMALL_DROPDOWN_BUTTON_STYLE,
  SMALL_DROPDOWN_MENU_STYLE,
} from '~/components/Dropdowns/DropdownSelector'
import { TimePeriod } from '~/data/util'
import { ChartActionsContainer } from '~/features/Explore/chart/ChartActionsContainer'
import { ChartTypeToggle, getChartTypeLabel } from '~/features/Explore/chart/ChartTypeToggle'
import { getPillTimeSelectorOptions } from '~/features/Explore/timeLabels'
import { AdvancedPriceChartToggle } from '~/pages/TokenDetails/components/chart/AdvancedPriceChartToggle'
import { usePrefetchTDPChartHistory } from '~/pages/TokenDetails/components/chart/hooks/usePrefetchTDPChartHistory'
import {
  getDisplayPriceChartType,
  type TDPChartQueryVariables,
  type TokenDetailsChartType,
} from '~/pages/TokenDetails/components/chart/TDPChartState'
import { useTDPChartStateContext } from '~/pages/TokenDetails/components/chart/TDPChartStateContext'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

const TOKEN_DETAILS_CHART_OPTIONS: TokenDetailsChartType[] = [ChartType.PRICE, ChartType.VOLUME, ChartType.TVL]

export function ChartControls({
  variables,
  isPriceDiscovery,
}: {
  variables: TDPChartQueryVariables
  /** Auction-only token with a live auction: no series exists on any chart type or range. */
  isPriceDiscovery?: boolean
}) {
  const { t } = useTranslation()
  const {
    chartType,
    timePeriod,
    setTimePeriod,
    setChartType,
    priceChartType,
    setPriceChartType,
    disableCandlestickUI,
  } = useTDPChartStateContext()
  const { address, currencyChainId } = useTDPStore((s) => ({
    address: s.address,
    currencyChainId: s.currencyChainId,
  }))
  const refitChartContent = useAtomValue(refitChartContentAtom)
  const media = useMedia()
  const isMediumScreen = media.lg
  const timeSelectorOptions = useMemo(() => getPillTimeSelectorOptions(t), [t])
  const showAdvancedPriceChartToggle = chartType === ChartType.PRICE && !isPriceDiscovery
  const displayPriceChartType = getDisplayPriceChartType(priceChartType, disableCandlestickUI)
  const prefetchTimePeriod = usePrefetchTDPChartHistory({ variables, chartType, displayPriceChartType })
  const [isChartTypeMenuOpen, setIsChartTypeMenuOpen] = useState(false)
  const [isTimePeriodMenuOpen, setIsTimePeriodMenuOpen] = useState(false)
  const chartTypeMenuOptions = useMemo<Record<string, SelectOption>>(
    () => Object.fromEntries(TOKEN_DETAILS_CHART_OPTIONS.map((c) => [c, { label: getChartTypeLabel(t, c) }])),
    [t],
  )
  const timePeriodMenuOptions = useMemo<Record<string, SelectOption>>(
    () => Object.fromEntries(timeSelectorOptions.map((option) => [option.value, { label: option.displayText ?? '' }])),
    [timeSelectorOptions],
  )

  const onChartTypeChange = (c: ChartType) => {
    if (c !== chartType) {
      sendAnalyticsEvent(InterfaceEventName.ChartSettingSelected, {
        page: InterfacePageName.TokenDetailsPage,
        selection: 'chart_type',
        chart_type: c,
        time_period: timePeriod,
        previous_value: chartType,
        chain_id: currencyChainId,
        token_address: address,
      })
    }
    setChartType(c as TokenDetailsChartType)
    if (c === ChartType.PRICE) {
      setPriceChartType(PriceChartType.LINE)
    }
  }

  const onTimePeriodChange = (option: TimePeriod) => {
    if (option === timePeriod) {
      refitChartContent?.()
    } else {
      sendAnalyticsEvent(InterfaceEventName.ChartSettingSelected, {
        page: InterfacePageName.TokenDetailsPage,
        selection: 'time_period',
        chart_type: chartType,
        time_period: option,
        previous_value: timePeriod,
        chain_id: currencyChainId,
        token_address: address,
      })
      setTimePeriod(option)
    }
  }

  const advancedPriceChartToggle = showAdvancedPriceChartToggle && (
    <AdvancedPriceChartToggle
      currentChartType={displayPriceChartType}
      onChartTypeChange={setPriceChartType}
      disableCandlestickUI={disableCandlestickUI}
    />
  )

  if (media.md) {
    // Neither dropdown can be disabled, and during price discovery there is nothing to switch to.
    if (isPriceDiscovery) {
      return null
    }
    return (
      <Flex row alignItems="center" gap="$gap8" mt="$spacing12" width="100%">
        {advancedPriceChartToggle}
        <Flex row gap="$gap8" ml="auto">
          <DropdownSelector
            options={chartTypeMenuOptions}
            selectedValue={chartType}
            onSelect={(c) => onChartTypeChange(c as ChartType)}
            isOpen={isChartTypeMenuOpen}
            toggleOpen={setIsChartTypeMenuOpen}
            dataTestId={TestID.TokenDetailsChartTypeSelector}
            buttonStyle={SMALL_DROPDOWN_BUTTON_STYLE}
            dropdownStyle={SMALL_DROPDOWN_MENU_STYLE}
            alignRight
          />
          <DropdownSelector
            options={timePeriodMenuOptions}
            selectedValue={timePeriod}
            onSelect={(option) => onTimePeriodChange(option as TimePeriod)}
            isOpen={isTimePeriodMenuOpen}
            toggleOpen={setIsTimePeriodMenuOpen}
            dataTestId={TestID.TokenDetailsChartTimePeriodSelector}
            buttonStyle={SMALL_DROPDOWN_BUTTON_STYLE}
            dropdownStyle={SMALL_DROPDOWN_MENU_STYLE}
            alignRight
          />
        </Flex>
      </Flex>
    )
  }

  return (
    <ChartActionsContainer>
      <Flex row gap="$gap8">
        {advancedPriceChartToggle}
        {!isPriceDiscovery && (
          <Flex>
            <ChartTypeToggle
              availableOptions={TOKEN_DETAILS_CHART_OPTIONS}
              currentChartType={chartType}
              onChartTypeChange={onChartTypeChange}
            />
          </Flex>
        )}
      </Flex>
      <Flex>
        <SegmentedControl
          disabled={isPriceDiscovery}
          fullWidth={isMediumScreen}
          options={timeSelectorOptions}
          selectedOption={timePeriod}
          onHoverOption={prefetchTimePeriod}
          onSelectOption={onTimePeriodChange}
        />
      </Flex>
    </ChartActionsContainer>
  )
}
