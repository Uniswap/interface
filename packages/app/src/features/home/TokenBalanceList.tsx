// import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { useMemo } from 'react'
import { Text, YStack } from 'ui/src'
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
  const { data } = useSortedPortfolioBalances(
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

  if (!data || data?.balances?.length === 0) {
    return (
      <Text color="accentCritical" variant="bodyLarge">
        Error loading balances
      </Text>
    )
  }

  return (
    <YStack marginTop="$spacing16">
      {listItems?.map((balance: PortfolioBalance) => {
        return <TokenBalanceItem portfolioBalance={balance} />
      })}
    </YStack>
  )
}
