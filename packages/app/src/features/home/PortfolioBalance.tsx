import { PollingInterval } from 'app/src/constants/misc'
import { usePortfolioBalanceQuery } from 'app/src/data/__generated__/types-and-hooks'
import { YStack } from 'tamagui'
import { Text } from 'ui/src'

type WalletBalanceProps = {
  address: Address
}

export function PortfolioBalance({ address }: WalletBalanceProps): JSX.Element {
  const { data, loading, error } = usePortfolioBalanceQuery({
    variables: {
      owner: address,
    },
    pollInterval: PollingInterval.Slow,
  })

  const portfolioBalance = data?.portfolios?.[0]
  const portfolioChange =
    portfolioBalance?.tokensTotalDenominatedValueChange?.percentage?.value
  const totalBalance = portfolioBalance?.tokensTotalDenominatedValue?.value

  if (loading) {
    return <Text variant="subheadLarge">Loading</Text>
  }

  if (error) {
    return (
      <Text color="$accentCritical" variant="bodyLarge">
        Error: {JSON.stringify(error)}
      </Text>
    )
  }

  return (
    <YStack space="$spacing12">
      <Text variant="headlineMedium">${totalBalance?.toFixed(2)}</Text>
      <Text variant="headlineSmall">{portfolioChange?.toFixed(2)}%</Text>
    </YStack>
  )
}
