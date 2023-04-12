// import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { useMemo } from 'react'
import { ScrollView } from 'tamagui'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { EMPTY_ARRAY } from '../../constants/misc'
import { useSortedPortfolioBalances } from '../dataApi/balances'
import { PortfolioBalance } from '../dataApi/types'
import { TokenBalanceItem } from './TokenBalanceItem'

type TokenBalanceListProps = {
  owner: Address
}

const HIDDEN_TOKENS_ROW = 'HIDDEN_TOKENS_ROW'

export const TokenBalanceList = ({
  owner,
}: TokenBalanceListProps): JSX.Element => {
  const { data, loading } = useSortedPortfolioBalances(
    owner,
    /*shouldPoll=*/ true,
    /* hideSmallBalances=*/ false,
    /* hideSpamTokens=*/ true
    // onCompleted
  )

  const listItems: PortfolioBalance[] = useMemo(() => {
    if (!data) {
      return EMPTY_ARRAY
    }

    const { balances, smallBalances, spamBalances } = data

    // No balances
    if (!balances.length && !smallBalances.length && !spamBalances.length) {
      return EMPTY_ARRAY
    }

    // No hidden tokens
    if (
      balances.length > 0 &&
      smallBalances.length === 0 &&
      spamBalances.length === 0
    ) {
      return balances
    }

    // Show all tokens including hidden
    return [...balances, HIDDEN_TOKENS_ROW, ...smallBalances, ...spamBalances]
  }, [data])

  if (!data && loading) {
    return (
      <Flex marginTop="$spacing16" paddingHorizontal="$spacing16" width="100%">
        <Text color="$textSecondary" variant="bodyLarge">
          Loading balances
        </Text>
      </Flex>
    )
  }

  if (!data || data?.balances?.length === 0) {
    return (
      <Flex marginTop="$spacing16" paddingHorizontal="$spacing16" width="100%">
        <Text color="$textTertiary" variant="bodyLarge">
          No tokens
        </Text>
      </Flex>
    )
  }

  return (
    <ScrollView
      backgroundColor="$background1"
      marginTop="$spacing16"
      // TODO: make this dynamic
      maxHeight={330}
      width="100%">
      {listItems?.map((balance: PortfolioBalance) => {
        return (
          <TokenBalanceItem
            // TODO: before passing down loading, add subtle animation on refresh of data, and make loaders take up same space as final objects
            // loading={loading}
            portfolioBalance={balance}
          />
        )
      })}
    </ScrollView>
  )
}
