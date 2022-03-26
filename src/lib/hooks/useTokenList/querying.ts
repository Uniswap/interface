import { nativeOnChain } from 'constants/tokens'
import useDebounce from 'hooks/useDebounce'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useTokenBalances } from 'lib/hooks/useCurrencyBalance'
import { useMemo } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { getTokenFilter } from './filtering'
import { tokenComparator, useSortTokensByQuery } from './sorting'

export function useQueryTokens(query: string, tokens: WrappedTokenInfo[]) {
  const { chainId, account } = useActiveWeb3React()
  const balances = useTokenBalances(account, tokens)
  const sortedTokens = useMemo(
    // Create a new array because sort is in-place and returns a referentially equivalent array.
    () => Array.from(tokens).sort(tokenComparator.bind(null, balances)),
    [balances, tokens]
  )

  const debouncedQuery = useDebounce(query, 200)
  const filter = useMemo(() => getTokenFilter(debouncedQuery), [debouncedQuery])
  const filteredTokens = useMemo(() => sortedTokens.filter(filter), [filter, sortedTokens])

  const queriedTokens = useSortTokensByQuery(debouncedQuery, filteredTokens)

  const native = useMemo(() => chainId && nativeOnChain(chainId), [chainId])
  return useMemo(() => {
    if (native && filter(native)) {
      return [native, ...queriedTokens]
    }
    return queriedTokens
  }, [filter, native, queriedTokens])
}
