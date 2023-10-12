import React, { useEffect, useState } from 'react'
import AnimatedNumber from 'src/components/AnimatedNumber'
import { Flex } from 'ui/src'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isWarmLoadingStatus } from 'wallet/src/data/utils'
import { usePortfolioBalancesQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { useFiatCurrencyConversion } from 'wallet/src/utils/currency'

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
    // This is better than using network status to check, because doing it that way we would have to wait
    // for the network status to go back to "ready", which results in the numbers updating, and _then_ the
    // shimmer disappearing. Using onCompleted it disappears at the same time as the data loads in.
    onCompleted: () => {
      setIsWarmLoading(false)
    },
  })

  const [isWarmLoading, setIsWarmLoading] = useState(false)
  const isLoading = loading && !data

  useEffect(() => {
    if (!!data && isWarmLoadingStatus(networkStatus)) {
      setIsWarmLoading(true)
    }
  }, [data, networkStatus])

  const portfolioBalance = data?.portfolios?.[0]
  const portfolioChange = portfolioBalance?.tokensTotalDenominatedValueChange

  const { amount: totalBalance } = useFiatCurrencyConversion(
    portfolioBalance?.tokensTotalDenominatedValue?.value
  )
  const { amount: absoluteChange } = useFiatCurrencyConversion(portfolioChange?.absolute?.value)

  return (
    <Flex gap="$spacing4">
      <AnimatedNumber
        colorIndicationDuration={2000}
        loading={isWarmLoading || isLoading}
        loadingPlaceholderText="$00000.00"
        value={formatUSDPrice(totalBalance, NumberType.PortfolioBalance)}
      />
      <RelativeChange
        absoluteChange={absoluteChange}
        arrowSize="$icon.20"
        change={portfolioChange?.percentage?.value}
        loading={isWarmLoading || isLoading}
        negativeChangeColor={isWarmLoading ? '$neutral2' : '$statusCritical'}
        positiveChangeColor={isWarmLoading ? '$neutral2' : '$statusSuccess'}
        variant="body1"
      />
    </Flex>
  )
}
