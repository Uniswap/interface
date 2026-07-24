import { SharedEventName } from '@uniswap/analytics-events'
import type { Currency } from '@uniswap/sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, Loader, styled, Text, TouchableArea, useShadowPropsShort, useSporeColors } from 'ui/src'
import { ArrowsExpand } from 'ui/src/components/icons/ArrowsExpand'
import { iconSizes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FORMAT_DATE_MONTH_DAY_TIME, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { TimePeriod, toHistoryDuration } from '~/appGraphql/data/util'
import { ChartUnavailableOverlay } from '~/components/Charts/ChartUnavailableOverlay'
import { useChartAnimatedColor } from '~/components/Charts/hooks/useChartAnimatedColor'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { PriceChartBody } from '~/components/Charts/PriceChart'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { useColor } from '~/hooks/useColor'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { useNavigateToTokenDetails } from '~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { useSlideoutChartCardCurrencies } from '~/pages/Swap/Swap/SlideoutChartCard/useSlideoutChartCardCurrencies'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

const TIME_OPTIONS = [
  { value: '1H', period: TimePeriod.HOUR },
  { value: '1D', period: TimePeriod.DAY },
  { value: '1W', period: TimePeriod.WEEK },
  { value: '1M', period: TimePeriod.MONTH },
  { value: '1Y', period: TimePeriod.YEAR },
] as const

/** Matches the chart placeholder height from the original SlideoutChartCard design. */
const SWAP_CHART_AREA_HEIGHT = 108

const CardShell = styled(Flex, {
  width: '100%',
  height: '100%',
  backgroundColor: '$surface1',
  borderColor: '$surface3',
  borderWidth: '$spacing1',
  borderStyle: 'solid',
  borderRadius: '$rounded20',
  p: '$spacing8',
  gap: '$spacing8',
})

interface SlideoutChartCardContentProps {
  selectedCurrency: Currency
  timePeriod: TimePeriod
  onTimePeriodChange: (period: TimePeriod) => void
  crosshairData: PriceChartData | undefined
  onCrosshairChange: (data: PriceChartData | undefined) => void
  inputCurrency: Currency | undefined
  outputCurrency: Currency | undefined
  selectedField: CurrencyField
  onSelectedFieldChange: (field: CurrencyField) => void
}

function SlideoutChartCardContent({
  selectedCurrency,
  timePeriod,
  onTimePeriodChange,
  crosshairData,
  onCrosshairChange,
  inputCurrency,
  outputCurrency,
  selectedField,
  onSelectedFieldChange,
}: SlideoutChartCardContentProps): JSX.Element {
  const shadowProps = useShadowPropsShort()

  return (
    <CardShell {...shadowProps}>
      <SlideoutChartCardBody
        selectedCurrency={selectedCurrency}
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        crosshairData={crosshairData}
        onCrosshairChange={onCrosshairChange}
        inputCurrency={inputCurrency}
        outputCurrency={outputCurrency}
        selectedField={selectedField}
        onSelectedFieldChange={onSelectedFieldChange}
      />
    </CardShell>
  )
}

interface SlideoutChartCardBodyProps {
  selectedCurrency: Currency
  timePeriod: TimePeriod
  onTimePeriodChange: (period: TimePeriod) => void
  crosshairData: PriceChartData | undefined
  onCrosshairChange: (data: PriceChartData | undefined) => void
  inputCurrency: Currency | undefined
  outputCurrency: Currency | undefined
  selectedField: CurrencyField
  onSelectedFieldChange: (field: CurrencyField) => void
}

function SlideoutChartCardBody({
  selectedCurrency,
  timePeriod,
  onTimePeriodChange,
  crosshairData,
  onCrosshairChange,
  inputCurrency,
  outputCurrency,
  selectedField,
  onSelectedFieldChange,
}: SlideoutChartCardBodyProps): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { currentTab } = useSwapAndLimitContext()

  const handleCopyAddress = useCallback(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.SlideoutChartCardCopyAddress,
      token_symbol: selectedCurrency.symbol,
      chain_id: selectedCurrency.chainId,
      chain_name: getChainLabel(selectedCurrency.chainId as UniverseChainId),
      token_address: selectedCurrency.isToken ? selectedCurrency.address : undefined,
      tab: currentTab,
    })
  }, [selectedCurrency, currentTab])
  const localizedDayjs = useLocalizedDayjs()
  const navigateToTokenDetails = useNavigateToTokenDetails()
  const sporeColors = useSporeColors()
  const tokenColor = useColor(selectedCurrency)

  const variables = useMemo((): TokenPriceChartQueryVariables => {
    const chain = toGraphQLChain(selectedCurrency.chainId as UniverseChainId)
    const address = selectedCurrency.isNative ? getNativeTokenDBAddress(chain) : selectedCurrency.address
    return { chain, address, duration: toHistoryDuration(timePeriod), multichain: false }
  }, [selectedCurrency, timePeriod])

  const { priceQuery, pricePercentChange, showInvalidSkeleton, stale } = useTokenPriceChartPanel({
    variables,
    priceChartType: PriceChartType.LINE,
    timePeriod,
    currency: selectedCurrency,
  })

  const { entries, loading } = priceQuery
  const lastEntry = entries.at(-1)
  const firstEntry = entries.at(0)
  const displayPrice = crosshairData?.value ?? lastEntry?.value
  const showTokenToggle = !!inputCurrency && !!outputCurrency
  // Distinguishes the initial fetch (no data yet) from a background refetch/poll — once we've
  // determined price/chart data is unavailable, keep showing that state (shimmer-free) instead of
  // reverting to a loading skeleton.
  const isInitialLoad = loading && entries.length === 0

  const targetChartColor = crosshairData
    ? crosshairData.value >= (firstEntry?.value ?? crosshairData.value)
      ? sporeColors.statusSuccess.val
      : sporeColors.statusCritical.val
    : tokenColor
  const chartColor = useChartAnimatedColor(targetChartColor)

  return (
    <>
      {/* Token row — px provides horizontal inset; outer card p already covers top */}
      <Flex row alignItems="center" px="$spacing8">
        <Flex row flex={1} alignItems="center" gap="$spacing8">
          <CurrencyLogo currency={selectedCurrency} size={24} />
          <Text variant="body2" color="$neutral2">
            {selectedCurrency.symbol ?? '—'}
          </Text>
        </Flex>
        <Flex row gap="$spacing4">
          {!selectedCurrency.isNative && (
            <Flex centered width={28} height={28} borderRadius="$rounded6">
              <CopyHelper
                toCopy={selectedCurrency.address}
                iconSize={iconSizes.icon16}
                iconColor="$neutral2"
                iconPosition="left"
                copyNotificationType={CopyNotificationType.ContractAddress}
                onCopy={handleCopyAddress}
              />
            </Flex>
          )}
          <TouchableArea
            onPress={() => {
              sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
                element: ElementName.SlideoutChartCardExpand,
                token_symbol: selectedCurrency.symbol,
                chain_id: selectedCurrency.chainId,
                chain_name: getChainLabel(selectedCurrency.chainId as UniverseChainId),
                tab: currentTab,
              })
              navigateToTokenDetails(selectedCurrency)
            }}
          >
            <Flex centered width={28} height={28} borderRadius="$rounded6">
              <ArrowsExpand color="$neutral2" size={iconSizes.icon12} />
            </Flex>
          </TouchableArea>
        </Flex>
      </Flex>

      {/* Price + delta — shown whenever a price is known, independent of chart data availability or refetch state */}
      <Flex gap="$spacing4" px="$spacing8">
        {displayPrice === undefined ? (
          <>
            <Loader.Box height={28} width={120} borderRadius="$rounded8" disableShimmer={!isInitialLoad} />
            <Loader.Box height={16} width={80} borderRadius="$rounded8" disableShimmer={!isInitialLoad} />
          </>
        ) : (
          <>
            <AnimatedNumber
              numericValue={displayPrice}
              value={convertFiatAmountFormatted(displayPrice, NumberType.FiatTokenPrice)}
              textVariant="$heading3"
              disableAnimations={!!crosshairData}
            />
            {firstEntry !== undefined && (
              <Flex row alignItems="center" gap="$spacing8">
                <PriceChartDelta
                  startingPrice={firstEntry.value}
                  endingPrice={displayPrice}
                  shouldIncludeFiatDelta
                  pricePercentChange={pricePercentChange}
                  isHovering={!!crosshairData}
                />
                {crosshairData && (
                  <Text variant="body2" color="$neutral3">
                    {localizedDayjs.unix(crosshairData.time as number).format(FORMAT_DATE_MONTH_DAY_TIME)}
                  </Text>
                )}
              </Flex>
            )}
          </>
        )}
      </Flex>

      {/* Chart — fixed height so lightweight-charts always receives a non-zero height */}
      <Flex grow height={SWAP_CHART_AREA_HEIGHT}>
        {showInvalidSkeleton ? (
          isInitialLoad ? (
            <ChartSkeleton
              type={ChartType.PRICE}
              height={SWAP_CHART_AREA_HEIGHT}
              hidePriceIndicators
              hideXAxis
              hideYAxis
              chartTransform="translate(5, -70)"
            />
          ) : (
            <ChartUnavailableOverlay height={SWAP_CHART_AREA_HEIGHT} chartTransform="translate(5, -70)" />
          )
        ) : (
          <PriceChartBody
            data={entries}
            height={SWAP_CHART_AREA_HEIGHT}
            type={PriceChartType.LINE}
            stale={stale}
            timePeriod={toHistoryDuration(timePeriod)}
            onCrosshairChange={onCrosshairChange}
            overrideColor={chartColor}
            hideYAxis
            hideXAxis
            hideMinMaxLines
          />
        )}
      </Flex>

      {/* Controls row */}
      <Flex row justifyContent="space-between" alignItems="center">
        {/* Time period selector */}
        <Flex
          row
          borderColor="$surface3"
          borderWidth="$spacing1"
          borderStyle="solid"
          borderRadius="$roundedFull"
          p="$spacing4"
        >
          {TIME_OPTIONS.map(({ value, period }) => {
            const isSelected = timePeriod === period
            return (
              <TouchableArea
                key={value}
                onPress={() => {
                  sendAnalyticsEvent(InterfaceEventName.SlideoutChartCardTimePeriodSelected, {
                    time_period: value,
                    token_symbol: selectedCurrency.symbol,
                    chain_id: selectedCurrency.chainId,
                    chain_name: getChainLabel(selectedCurrency.chainId as UniverseChainId),
                    tab: currentTab,
                  })
                  onTimePeriodChange(period)
                  onCrosshairChange(undefined)
                }}
              >
                <Flex
                  px="$spacing8"
                  py="$spacing2"
                  borderRadius="$roundedFull"
                  backgroundColor={isSelected ? '$surface3' : undefined}
                >
                  <Text variant="buttonLabel4" color={isSelected ? '$neutral1' : '$neutral2'}>
                    {value}
                  </Text>
                </Flex>
              </TouchableArea>
            )
          })}
        </Flex>

        {/* Token toggle — only shown when both tokens are populated */}
        {showTokenToggle && (
          <Flex
            row
            borderColor="$surface3"
            borderWidth="$spacing1"
            borderStyle="solid"
            borderRadius="$roundedFull"
            p="$spacing4"
          >
            {([CurrencyField.INPUT, CurrencyField.OUTPUT] as const).map((field) => {
              const currency = field === CurrencyField.INPUT ? inputCurrency : outputCurrency
              const isSelected = selectedField === field
              return (
                <TouchableArea
                  key={field}
                  onPress={() => {
                    sendAnalyticsEvent(InterfaceEventName.SlideoutChartCardTokenToggled, {
                      token_field: field,
                      token_symbol: currency.symbol,
                      chain_id: currency.chainId,
                      chain_name: getChainLabel(currency.chainId as UniverseChainId),
                      tab: currentTab,
                    })
                    onSelectedFieldChange(field)
                    onCrosshairChange(undefined)
                  }}
                >
                  <Flex
                    px="$spacing8"
                    py="$spacing2"
                    borderRadius="$roundedFull"
                    backgroundColor={isSelected ? '$surface3' : undefined}
                  >
                    <Text variant="buttonLabel4" color={isSelected ? '$neutral1' : '$neutral2'}>
                      {currency.symbol ?? '—'}
                    </Text>
                  </Flex>
                </TouchableArea>
              )
            })}
          </Flex>
        )}
      </Flex>
    </>
  )
}

export function SlideoutChartCard({ isChartOpen }: { isChartOpen: boolean }): JSX.Element | null {
  const [timePeriod, setTimePeriod] = useState(TimePeriod.DAY)
  const [crosshairData, setCrosshairData] = useState<PriceChartData | undefined>()

  const { inputCurrency, outputCurrency } = useSlideoutChartCardCurrencies()
  const { currentTab } = useSwapAndLimitContext()

  const [selectedField, setSelectedField] = useState<CurrencyField>(CurrencyField.INPUT)
  const selectedCurrency =
    (selectedField === CurrencyField.INPUT ? inputCurrency : outputCurrency) ?? inputCurrency ?? outputCurrency

  useEffect(() => {
    if (!selectedCurrency) {
      return
    }
    sendAnalyticsEvent(InterfaceEventName.SlideoutChartCardTokenSelected, {
      token_symbol: selectedCurrency.symbol,
      chain_id: selectedCurrency.chainId,
      chain_name: getChainLabel(selectedCurrency.chainId as UniverseChainId),
      token_address: selectedCurrency.isToken ? selectedCurrency.address : undefined,
      tab: currentTab,
      is_chart_open: isChartOpen,
    })
  }, [isChartOpen, selectedCurrency, currentTab])

  if (!selectedCurrency) {
    return null
  }

  return (
    <SlideoutChartCardContent
      selectedCurrency={selectedCurrency}
      timePeriod={timePeriod}
      onTimePeriodChange={setTimePeriod}
      crosshairData={crosshairData}
      onCrosshairChange={setCrosshairData}
      inputCurrency={inputCurrency}
      outputCurrency={outputCurrency}
      selectedField={selectedField}
      onSelectedFieldChange={setSelectedField}
    />
  )
}
