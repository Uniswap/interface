// import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { useMemo } from 'react'
import { ScrollView } from 'tamagui'
import { Flex, Text } from 'ui/src'
import { useSortedPortfolioBalances } from 'wallet/src/features/dataApi/balances'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { TokenBalanceItem } from './TokenBalanceItem'

type TokenBalanceListProps = {
  owner: Address
}

export function TokenBalanceList({ owner }: TokenBalanceListProps): JSX.Element {
  const { data, loading } = useSortedPortfolioBalances(
    owner,
    /*shouldPoll=*/ true,
    /* hideSmallBalances=*/ false,
    /* hideSpamTokens=*/ true
    // onCompleted
  )

  const listItems = useMemo((): PortfolioBalance[] | undefined => {
    if (!data) return

    const { balances, smallBalances, spamBalances } = data

    // No balances
    if (!balances.length && !smallBalances.length && !spamBalances.length) return

    // No hidden tokens
    if (balances.length > 0 && smallBalances.length === 0 && spamBalances.length === 0) {
      return balances
    }

    // Show all tokens including hidden
    return [...balances, ...smallBalances, ...spamBalances]
  }, [data])

  if (!data && loading) {
    return (
      <Flex centered minHeight={100} width="100%">
        <Text color="$neutral3" variant="body1">
          Loading token balances...
        </Text>
      </Flex>
    )
  }

  if (!data || data?.balances?.length === 0) {
    return (
      <Flex centered minHeight={100} width="100%">
        <Text color="$neutral3" variant="body1">
          No tokens
        </Text>
      </Flex>
    )
  }

  return (
    <ScrollView pt="$spacing8" showsVerticalScrollIndicator={false} width="100%">
      {listItems?.map((balance: PortfolioBalance) => {
        return (
          <TokenBalanceItem
            key={balance.currencyInfo.currencyId}
            // TODO: before passing down loading, add subtle animation on refresh of data, and make loaders take up same space as final objects
            // loading={loading}
            portfolioBalance={balance}
          />
        )
      })}
    </ScrollView>
  )
}
