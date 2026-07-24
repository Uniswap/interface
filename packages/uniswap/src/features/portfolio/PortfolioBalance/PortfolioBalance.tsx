import { type ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { isWebPlatform } from '@universe/environment'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, RefreshButton, Text, useIsDarkMode } from 'ui/src'
import { spacing } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { BALANCE_CHANGE_INDICATION_DURATION } from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  getUnavailableCategories,
  isEmptyWalletBalance,
  PortfolioBalancePart,
  sumAvailableBalanceSlices,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioBalanceBreakdown } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { chartPeriodToTimeLabel } from 'uniswap/src/features/portfolio/chartPeriod'
import { BalanceUnavailableIndicator } from 'uniswap/src/features/portfolio/PortfolioBalance/BalanceUnavailableIndicator'
import { Change1dUnavailableIndicator } from 'uniswap/src/features/portfolio/PortfolioBalance/Change1dUnavailableIndicator'
import {
  getPortfolioRelativeChangeDisplay,
  PortfolioRelativeChangeDisplay,
} from 'uniswap/src/features/portfolio/PortfolioBalance/getPortfolioRelativeChangeDisplay'
import { PortfolioRelativeChange } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioRelativeChange'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'

interface PortfolioBalanceProps {
  evmOwner?: Address
  svmOwner?: Address
  endText?: JSX.Element | string
  chainIds?: UniverseChainId[]
  chartPeriod?: ChartPeriod
  /** When set, overrides the displayed balance (e.g. during chart scrubbing) */
  overrideBalanceUSD?: number
  /** When set, overrides the backend 1-day percent change with a period-aware value */
  overridePercentChange?: number
  /** When set, overrides the backend 1-day absolute change with a period-aware value */
  overrideAbsoluteChangeUSD?: number
  /** When true, hides the percent change (absolute change still shown) */
  hidePercentChange?: boolean
  /** When true, suppresses the unavailable-category indicator (e.g. when a banner conveys it instead) */
  hideUnavailableIndicator?: boolean
  part?: PortfolioBalancePart
  /** When true, skips the internal poll — use when a parent coordinator already refreshes this data on its own cadence. */
  disablePolling?: boolean
}

export const PortfolioBalance = memo(function PortfolioBalanceInner({
  evmOwner,
  svmOwner,
  endText,
  chainIds,
  chartPeriod,
  overrideBalanceUSD,
  overridePercentChange,
  overrideAbsoluteChangeUSD,
  hidePercentChange,
  hideUnavailableIndicator,
  part = PortfolioBalancePart.Total,
  disablePolling = false,
}: PortfolioBalanceProps): JSX.Element {
  const { t } = useTranslation()
  const {
    data: breakdown,
    requestedCategories,
    loading,
    error,
    refetch,
  } = usePortfolioBalanceBreakdown({
    evmAddress: evmOwner,
    svmAddress: svmOwner,
    chainIds,
    // TransactionHistoryUpdater will refetch this query on new transaction.
    // No need to be super aggressive with polling here.
    pollInterval: disablePolling ? undefined : PollingInterval.Normal,
  })

  const data = breakdown?.[part]

  // A requested opt-in category whose slice the backend omitted makes the aggregate total
  // incomplete, so fall back to the sum of the categories that did resolve. Categories we did not
  // request are omitted by design and are not treated as unavailable.
  const unavailableCategories = useMemo(
    () => getUnavailableCategories({ breakdown, requestedCategories }),
    [breakdown, requestedCategories],
  )
  const hasIncompleteTotal =
    part === PortfolioBalancePart.Total && breakdown !== undefined && unavailableCategories.length > 0
  const activeData = hasIncompleteTotal ? sumAvailableBalanceSlices(breakdown) : data

  // Ensure component switches theme
  useIsDarkMode()

  const currency = useAppFiatCurrency()
  const currencyComponents = useAppFiatCurrencyInfo()
  const { convertFiatAmount, convertFiatAmountFormatted } = useLocalizationContext()

  const isLoading = !activeData && (loading || !!error)
  const isWarmLoading = !!activeData && loading

  const walletEmpty = isEmptyWalletBalance(breakdown)

  const {
    percentChange: rawPercentChange,
    absoluteChangeUSD: rawAbsoluteChangeUSD,
    balanceUSD: rawBalanceUSD,
  } = activeData || {}

  // An empty wallet legitimately has no value, but the backend omits every field (`undefined`),
  // which would render the "unavailable"/"-" states. Coalesce to an explicit `0` so it shows $0.00
  // and 0.00%, as the portfolio did before GetWalletBalances.
  const backendPercentChange = walletEmpty ? 0 : rawPercentChange
  const backendAbsoluteChangeUSD = walletEmpty ? 0 : rawAbsoluteChangeUSD
  const balanceUSD = walletEmpty ? 0 : rawBalanceUSD

  const percentChange = hidePercentChange ? undefined : (overridePercentChange ?? backendPercentChange)
  const absoluteChangeUSD = overrideAbsoluteChangeUSD ?? backendAbsoluteChangeUSD

  // Read from the coalesced backend value (the displayed source, which falls back to the sum of
  // available slices when a requested category is unavailable) so the check matches `percentChange`
  // above. `undefined` means the server omitted the field (unavailable); `0` is a valid zero, including an empty wallet.
  const backendPercentChangeUnavailable = !!activeData && backendPercentChange === undefined

  const changeDisplay = getPortfolioRelativeChangeDisplay({
    enabled: requestedCategories.length > 0,
    part,
    backendPercentChangeUnavailable,
    hasOverride: overridePercentChange !== undefined,
    hidePercentChange,
    isLoading,
  })

  const displayBalanceUSD = overrideBalanceUSD ?? balanceUSD
  const totalBalance = convertFiatAmountFormatted(displayBalanceUSD, NumberType.PortfolioBalance)
  const absoluteChange = absoluteChangeUSD && convertFiatAmount(absoluteChangeUSD).amount
  // TODO gary re-enabling this for USD/Euros only, replace with more scalable approach
  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) && currencyComponents.symbolAtFront

  const unavailableIndicator = useMemo(() => {
    if (!hasIncompleteTotal || hideUnavailableIndicator || unavailableCategories.length === 0) {
      return undefined
    }
    return <BalanceUnavailableIndicator categories={unavailableCategories} />
  }, [hasIncompleteTotal, hideUnavailableIndicator, unavailableCategories])

  const balanceEndElement = useMemo(() => {
    const refreshButton = isWebPlatform ? <RefreshButton isLoading={loading} onPress={refetch} /> : undefined
    if (unavailableIndicator && refreshButton) {
      return (
        <Flex row alignItems="center" gap="$spacing4">
          {unavailableIndicator}
          {refreshButton}
        </Flex>
      )
    }
    return unavailableIndicator ?? refreshButton
  }, [unavailableIndicator, loading, refetch])

  return (
    <Flex gap="$spacing4" testID={TestID.PortfolioBalance}>
      <AnimatedNumber
        numericValue={displayBalanceUSD}
        colorIndicationDuration={overrideBalanceUSD !== undefined ? 0 : BALANCE_CHANGE_INDICATION_DURATION}
        disableAnimations={overrideBalanceUSD !== undefined}
        loading={isLoading}
        loadingPlaceholderText="000000.00"
        shouldFadeDecimals={shouldFadePortfolioDecimals}
        value={totalBalance}
        warmLoading={isWarmLoading}
        EndElement={balanceEndElement}
        endElementGap={spacing.spacing12}
      />
      <Flex row grow alignItems="center">
        {changeDisplay === PortfolioRelativeChangeDisplay.Unavailable ? (
          <Change1dUnavailableIndicator />
        ) : changeDisplay === PortfolioRelativeChangeDisplay.Omit ? null : (
          <PortfolioRelativeChange
            isLoading={isLoading}
            isWarmLoading={isWarmLoading}
            hasError={!!error}
            percentChange={percentChange}
            absoluteChange={absoluteChange}
          />
        )}
        {/* Hide period label during chart scrub (overrideBalanceUSD is set while scrubbing) */}
        {chartPeriod !== undefined && overrideBalanceUSD === undefined && (
          <Text variant="body3" color="$neutral3" ml="$spacing4">
            {chartPeriodToTimeLabel(t, chartPeriod).toLocaleLowerCase()}
          </Text>
        )}
        {endText}
      </Flex>
    </Flex>
  )
})
