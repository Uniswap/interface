import { isWarmLoadingStatus } from '@universe/api'
import { memo, useMemo } from 'react'
import { Flex, RefreshButton, Shine, useIsDarkMode } from 'ui/src'
import AnimatedNumber, {
  BALANCE_CHANGE_INDICATION_DURATION,
} from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import i18next from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'
import { isWebPlatform } from 'utilities/src/platform'

interface PortfolioBalanceProps {
  evmOwner?: Address
  svmOwner?: Address
  endText?: JSX.Element | string
  chainIds?: UniverseChainId[]
}

export const PortfolioBalance = memo(function _PortfolioBalance({
  evmOwner,
  svmOwner,
  endText,
  chainIds,
}: PortfolioBalanceProps): JSX.Element {
  const { data, loading, networkStatus, refetch } = usePortfolioTotalValue({
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

  const isLoading = loading && !data
  const isWarmLoading = !!data && isWarmLoadingStatus(networkStatus)

  const { percentChange, absoluteChangeUSD, balanceUSD } = data || {}

  const isRightToLeft = i18next.dir() === 'rtl'

  const totalBalance = convertFiatAmountFormatted(balanceUSD, NumberType.PortfolioBalance)
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
    <Flex gap="$spacing4">
      <AnimatedNumber
        balance={balanceUSD}
        colorIndicationDuration={BALANCE_CHANGE_INDICATION_DURATION}
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
            negativeChangeColor={isWarmLoading ? '$neutral2' : '$statusCritical'}
            positiveChangeColor={isWarmLoading ? '$neutral2' : '$statusSuccess'}
            variant="body3"
          />
        </Shine>
        {endText}
      </Flex>
    </Flex>
  )
})
