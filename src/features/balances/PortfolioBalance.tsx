import React, { useEffect, useState } from 'react'
import { Flex } from 'src/components/layout'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { PollingInterval } from 'src/constants/misc'
import { isWarmLoadingStatus } from 'src/data/utils'
import { usePortfolioBalanceQuery } from 'src/data/__generated__/types-and-hooks'
import { theme } from 'src/styles/theme'
import { formatUSDPrice, NumberType } from 'src/utils/format'

interface PortfolioBalanceProps {
  owner: Address
}

export function PortfolioBalance({ owner }: PortfolioBalanceProps): JSX.Element {
  const { data, loading, networkStatus } = usePortfolioBalanceQuery({
    variables: { owner },
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
  const totalBalance = portfolioBalance?.tokensTotalDenominatedValue?.value

  return (
    <WarmLoadingShimmer isWarmLoading={isWarmLoading && !isLoading}>
      <Flex gap="spacing4">
        <DecimalNumber
          adjustsFontSizeToFit={!isLoading}
          // initially set color to textSecondary when isWarm because the shimmer mask takes a second to load, resulting in a flash of the underlying color
          color={isWarmLoading ? 'textSecondary' : undefined}
          fontSize={48}
          fontWeight="600"
          formattedNumber={formatUSDPrice(totalBalance, NumberType.PortfolioBalance)}
          loading={isLoading}
          number={totalBalance}
          numberOfLines={1}
          variant="headlineLarge"
        />
        <RelativeChange
          absoluteChange={portfolioChange?.absolute?.value}
          arrowSize={theme.iconSizes.icon20}
          change={portfolioChange?.percentage?.value}
          loading={isLoading}
          negativeChangeColor={isWarmLoading ? 'textSecondary' : 'accentCritical'}
          positiveChangeColor={isWarmLoading ? 'textSecondary' : 'accentSuccess'}
          variant="bodyLarge"
        />
      </Flex>
    </WarmLoadingShimmer>
  )
}
