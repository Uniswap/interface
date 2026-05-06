import type { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { isWarmLoadingStatus } from '@universe/api'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, RefreshButton, Shine, Text, useIsDarkMode } from 'ui/src'
import AnimatedNumber, {
  BALANCE_CHANGE_INDICATION_DURATION,
} from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { PollingInterval } from 'uniswap/src/constants/misc'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { chartPeriodToTimeLabel } from 'uniswap/src/features/portfolio/chartPeriod'
import i18next from 'uniswap/src/i18n'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { isWebPlatform } from 'utilities/src/platform'

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
}: PortfolioBalanceProps): JSX.Element {
  const { t } = useTranslation()
  const { data, loading, error, networkStatus, refetch } = usePortfolioTotalValue({
    evmAddress: evmOwner,
    svmAddress: svmOwner,
    chainIds,
    // TransactionHistoryUpdater will refetch this query on new transaction.
    // No need to be super aggressive with polling here.
    pollInterval: PollingInterval.Normal,
  })

  // Ensure component switches theme
  useIsDarkMode()

  const currency = useAppFiatCurrency()
  const currencyComponents = useAppFiatCurrencyInfo()
  const { convertFiatAmount, convertFiatAmountFormatted } = useLocalizationContext()

  const isLoading = !data && (loading || !!error)
  const isWarmLoading = !!data && isWarmLoadingStatus(networkStatus)

  const { percentChange: backendPercentChange, absoluteChangeUSD: backendAbsoluteChangeUSD, balanceUSD } = data || {}

  const percentChange = hidePercentChange ? undefined : (overridePercentChange ?? backendPercentChange)
  const absoluteChangeUSD = overrideAbsoluteChangeUSD ?? backendAbsoluteChangeUSD

  const isRightToLeft = i18next.dir() === 'rtl'

  const displayBalanceUSD = overrideBalanceUSD ?? balanceUSD
  const totalBalance = convertFiatAmountFormatted(displayBalanceUSD, NumberType.PortfolioBalance)
  const absoluteChange = absoluteChangeUSD && convertFiatAmount(absoluteChangeUSD).amount
  // TODO gary re-enabling this for USD/Euros only, replace with more scalable approach
  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) && currencyComponents.symbolAtFront

  const RefreshBalanceButton = useMemo(() => {
    if (isWebPlatform) {
      return <RefreshButton isLoading={loading} onPress={refetch} />
    }
    return undefined
  }, [loading, refetch])

  return (
    <Flex gap="$spacing4" testID={TestID.PortfolioBalance}>
      <AnimatedNumber
        balance={displayBalanceUSD}
        colorIndicationDuration={overrideBalanceUSD !== undefined ? 0 : BALANCE_CHANGE_INDICATION_DURATION}
        disableAnimations={overrideBalanceUSD !== undefined}
        loading={isLoading}
        loadingPlaceholderText="000000.00"
        shouldFadeDecimals={shouldFadePortfolioDecimals}
        value={totalBalance}
        warmLoading={isWarmLoading}
        isRightToLeft={isRightToLeft}
        EndElement={RefreshBalanceButton}
      />
      <Flex row grow alignItems="center">
        <Shine disabled={!isWarmLoading}>
          <RelativeChange
            absoluteChange={absoluteChange}
            arrowSize="$icon.16"
            change={percentChange}
            loading={isLoading}
            negativeChangeColor={isWarmLoading || !!error ? '$neutral2' : '$statusCritical'}
            positiveChangeColor={isWarmLoading || !!error ? '$neutral2' : '$statusSuccess'}
            variant="body3"
          />
        </Shine>
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
