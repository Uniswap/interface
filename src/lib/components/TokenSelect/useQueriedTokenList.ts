import useDebounce from 'hooks/useDebounce'
import useTokenList from 'lib/hooks/useTokenList'
import { useMemo } from 'react'

import { getTokenFilter, tokenComparator, useSortTokensByQuery } from './utils'

// TODO: Include balance

export default function useQueriedTokenList(query: string) {
  const tokenMap = useTokenList()
  const tokens = useMemo(() => Object.values(tokenMap).map(({ token }) => token), [tokenMap])

  // Sorts tokens
  // const { account } = useActiveWeb3React()
  const balances = useMemo(() => ({}), []) // TODO(zzmp): useTokenBalances(account, tokens) when it is split into lib
  const comparator = useMemo(() => tokenComparator.bind(null, balances), [balances])
  const sortedTokens = tokens.sort(comparator)

  // Filters tokens
  const debouncedQuery = useDebounce(query, 200)
  const filteredTokens = useMemo(
    () => sortedTokens.filter(getTokenFilter(debouncedQuery)),
    [debouncedQuery, sortedTokens]
  )

  // Re-sorts tokens (ie to bump up exact matches)
  const sortedFilteredTokens = useSortTokensByQuery(debouncedQuery, filteredTokens)

  // TODO(zzmp): Include native Currency
  return sortedFilteredTokens
}
