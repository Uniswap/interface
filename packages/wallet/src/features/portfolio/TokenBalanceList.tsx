// import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { useMemo } from 'react'
import { ScrollView } from 'tamagui'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
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
      <Flex marginTop="$spacing16" paddingHorizontal="$spacing16" width="100%">
        <Text color="$neutral2" variant="bodyLarge">
          Loading balances
        </Text>
      </Flex>
    )
  }

  if (!data || data?.balances?.length === 0) {
    return (
      <Flex marginTop="$spacing16" paddingHorizontal="$spacing16" width="100%">
        <Text color="$neutral3" variant="bodyLarge">
          No tokens
        </Text>
      </Flex>
    )
  }

  return (
    <ScrollView
      backgroundColor="$surface2"
      marginTop="$spacing16"
      paddingBottom="$spacing16"
      showsVerticalScrollIndicator={false}
      width="100%">
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
