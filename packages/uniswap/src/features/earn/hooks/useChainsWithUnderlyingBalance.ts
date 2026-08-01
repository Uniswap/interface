import { useMemo } from 'react'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'

/**
 * Resolves which chains the active wallet holds the underlying token on. Used by the earn
 * flow to (a) gate the deposit CTA on holding the underlying anywhere and (b) section the
 * withdraw network selector by "with balances" vs "without balances".
 *
 * Callers should gate routing/UI on `isReady` so loading state isn't treated as "no balance".
 */
export function useChainsWithUnderlyingBalance({
  currencyId,
  evmAddress,
  skip = false,
}: {
  currencyId?: string
  evmAddress?: string
  skip?: boolean
}): {
  chainsWithBalance: Set<UniverseChainId>
  hasAny: boolean
  isReady: boolean
} {
  const queryIds = useMemo(() => (currencyId ? [currencyId] : []), [currencyId])
  const { data: tokenProject } = useTokenProjects(queryIds)
  const portfolio = usePortfolioBalances({
    evmAddress,
    skip: skip || !evmAddress,
  })

  const chainsWithBalance = useMemo(() => {
    if (!tokenProject || !portfolio.data) {
      return new Set<UniverseChainId>()
    }
    const projectIdToChain = new Map<string, UniverseChainId>(
      tokenProject.map((info) => [normalizeCurrencyIdForMapLookup(info.currencyId), info.currency.chainId]),
    )
    const result = new Set<UniverseChainId>()
    Object.values(portfolio.data).forEach((entry) => {
      const chain = projectIdToChain.get(normalizeCurrencyIdForMapLookup(entry.currencyInfo.currencyId))
      if (chain !== undefined && entry.quantity > 0) {
        result.add(chain)
      }
    })
    return result
  }, [tokenProject, portfolio.data])

  return {
    chainsWithBalance,
    hasAny: chainsWithBalance.size > 0,
    isReady: portfolio.data !== undefined && tokenProject !== undefined,
  }
}
