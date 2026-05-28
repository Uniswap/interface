import { TokenInfo, TokenList as TokenListSchema } from '@uniswap/token-lists'
import { RING_DEFAULT_ACTIVE_LIST_URLS } from 'constants/lists'
import { useCallback, useMemo } from 'react'
import { useAllLists } from 'state/lists/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { currencyId } from 'uniswap/src/utils/currencyId'

function searchRank(token: CurrencyInfo, query: string): number {
  const symbol = token.currency.symbol?.toLowerCase() ?? ''
  const name = token.currency.name?.toLowerCase() ?? ''
  const address = token.currency.isToken ? token.currency.address.toLowerCase() : ''

  if (symbol === query) {
    return 0
  }
  if (name === query) {
    return 1
  }
  if (symbol.startsWith(query)) {
    return 2
  }
  if (name.startsWith(query)) {
    return 3
  }
  if (address.startsWith(query)) {
    return 4
  }
  if (symbol.includes(query)) {
    return 5
  }
  if (name.includes(query)) {
    return 6
  }
  return 7
}

export function useTokenSelectorListSearch(): (args: {
  chainFilter: UniverseChainId | null
  searchFilter: string | null
}) => CurrencyInfo[] | undefined {
  const lists = useAllLists()

  const activeListEntries = useMemo(() => {
    const entries: Array<{ info: TokenInfo; list: TokenListSchema }> = []
    const seen = new Set<string>()

    for (const url of RING_DEFAULT_ACTIVE_LIST_URLS) {
      const current = lists[url]?.current
      if (!current) {
        continue
      }

      for (const info of current.tokens) {
        const key = `${info.chainId}:${info.address.toLowerCase()}`
        if (seen.has(key)) {
          continue
        }
        seen.add(key)
        entries.push({ info, list: current })
      }
    }

    return entries
  }, [lists])

  return useCallback(
    ({ chainFilter, searchFilter }: { chainFilter: UniverseChainId | null; searchFilter: string | null }) => {
      const normalizedQuery = searchFilter?.trim().toLowerCase()
      if (!normalizedQuery) {
        return undefined
      }

      const isAddressQuery = normalizedQuery.startsWith('0x')
      const filtered: CurrencyInfo[] = []

      for (const { info, list } of activeListEntries) {
        const symbol = info.symbol?.toLowerCase() ?? ''
        const name = info.name?.toLowerCase() ?? ''
        const address = info.address.toLowerCase()

        const matchesQuery = isAddressQuery
          ? address.startsWith(normalizedQuery)
          : symbol.includes(normalizedQuery) || name.includes(normalizedQuery)

        if (!matchesQuery) {
          continue
        }

        if (chainFilter && !isAddressQuery && info.chainId !== chainFilter) {
          continue
        }

        try {
          const token = new WrappedTokenInfo(info, list)
          filtered.push(
            buildCurrencyInfo({
              currency: token,
              currencyId: currencyId(token),
              logoUrl: token.logoURI,
              safetyInfo: {
                tokenList: TokenList.Default,
                protectionResult: ProtectionResult.Benign,
              },
              isFromOtherNetwork: Boolean(isAddressQuery && chainFilter && token.chainId !== chainFilter),
            }),
          )
        } catch {
          continue
        }
      }

      if (!filtered.length) {
        return undefined
      }

      return filtered.sort((a, b) => searchRank(a, normalizedQuery) - searchRank(b, normalizedQuery))
    },
    [activeListEntries],
  )
}
