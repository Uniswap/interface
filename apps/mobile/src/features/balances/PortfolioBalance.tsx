import React from 'react'
import AnimatedNumber from 'src/components/AnimatedNumber'
import { Flex, Shine } from 'ui/src'
import { NumberType } from 'utilities/src/format/types'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isWarmLoadingStatus } from 'wallet/src/data/utils'
import { usePortfolioBalancesQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

interface PortfolioBalanceProps {
  owner: Address
}

export function PortfolioBalance({ owner }: PortfolioBalanceProps): JSX.Element {
  const { data, loading, networkStatus } = usePortfolioBalancesQuery({
    variables: { ownerAddress: owner },
    // TransactionHistoryUpdater will refetch this query on new transaction.
    // No need to be super aggressive with polling here.
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
  })
  const currency = useAppFiatCurrency()
  const currencyComponents = useAppFiatCurrencyInfo()
  const { convertFiatAmount, convertFiatAmountFormatted } = useLocalizationContext()

  const isLoading = loading && !data
  const isWarmLoading = !!data && isWarmLoadingStatus(networkStatus)

  const portfolioBalance = data?.portfolios?.[0]
  const portfolioChange = portfolioBalance?.tokensTotalDenominatedValueChange

  const totalBalance = convertFiatAmountFormatted(
    portfolioBalance?.tokensTotalDenominatedValue?.value,
    NumberType.PortfolioBalance
  )
  const { amount: absoluteChange } = convertFiatAmount(portfolioChange?.absolute?.value)
  // TODO gary re-enabling this for USD/Euros only, replace with more scalable approach
  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) &&
    currencyComponents.symbolAtFront

  return (
    <Flex gap="$spacing4">
      <AnimatedNumber
        colorIndicationDuration={2000}
        loading={isLoading}
        loadingPlaceholderText="000000.00"
        shouldFadeDecimals={shouldFadePortfolioDecimals}
        value={totalBalance}
        warmLoading={isWarmLoading}
      />

      <Shine disabled={!isWarmLoading}>
        <RelativeChange
          absoluteChange={absoluteChange}
          arrowSize="$icon.16"
          change={portfolioChange?.percentage?.value}
          loading={isLoading}
          negativeChangeColor={isWarmLoading ? '$neutral2' : '$statusCritical'}
          positiveChangeColor={isWarmLoading ? '$neutral2' : '$statusSuccess'}
          variant="body3"
        />
      </Shine>
    </Flex>
  )
}
