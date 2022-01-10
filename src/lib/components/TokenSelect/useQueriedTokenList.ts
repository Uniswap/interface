import useDebounce from 'hooks/useDebounce'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList from 'lib/hooks/useTokenList'
import { useMemo } from 'react'
import { useTokenBalances } from 'state/wallet/hooks'

import { createTokenFilterFunction, tokenComparator, useSortedTokensByQuery } from './utils'

export default function useQueriedTokenList(query: string) {
  const tokenMap = useTokenList()
  const tokens = useMemo(() => Object.values(tokenMap).map(({ token }) => token), [tokenMap])

  // Sorts tokens
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, tokens)
  const comparator = useMemo(() => tokenComparator.bind(null, balances), [balances])
  const sortedTokens = tokens.sort(comparator)

  // Filters tokens
  const debouncedQuery = useDebounce(query, 200)
  const filteredTokens = useMemo(
    () => sortedTokens.filter(createTokenFilterFunction(debouncedQuery)),
    [debouncedQuery, sortedTokens]
  )

  // Re-sorts tokens (ie to bump up exact matches)
  const sortedFilteredTokens = useSortedTokensByQuery(filteredTokens, debouncedQuery)

  // TODO(zzmp): Include native Currency
  return sortedFilteredTokens
}
