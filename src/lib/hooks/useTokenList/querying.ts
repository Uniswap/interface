import useDebounce from 'hooks/useDebounce'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useTokenBalances } from 'lib/hooks/useCurrencyBalance'
import { useMemo } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { getTokenFilter } from './filtering'
import { tokenComparator, useSortTokensByQuery } from './sorting'

export function useQueryTokens(query: string, tokens: WrappedTokenInfo[]) {
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, tokens)
  const sortedTokens = useMemo(() => [...tokens.sort(tokenComparator.bind(null, balances))], [balances, tokens])

  const debouncedQuery = useDebounce(query, 200)
  const filteredTokens = useMemo(
    () => sortedTokens.filter(getTokenFilter(debouncedQuery)),
    [debouncedQuery, sortedTokens]
  )

  return useSortTokensByQuery(debouncedQuery, filteredTokens)
}
