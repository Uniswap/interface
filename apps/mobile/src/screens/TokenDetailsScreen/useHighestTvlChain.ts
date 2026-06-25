import { useMemo } from 'react'
import { useBalances } from 'uniswap/src/data/balances/hooks/useBalances'
import { useTokenProjectTokensTvlPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { currencyId as getCurrencyId } from 'uniswap/src/utils/currencyId'

interface HighestTvlChainResult {
  chainId: UniverseChainId | null
  address: string | null
}

interface SortedChainEntry {
  chainId: UniverseChainId
  address: string | null
}

/**
 * Returns the best chain to redirect a "Buy" action to for a given token.
 *
 * When `accountAddress` is provided, walks the project's chains in TVL-descending order and
 * returns the first one where the user holds gas balance, so they land on a chain where the
 * swap can actually be completed.
 *
 * Falls back to the absolute highest-TVL chain if no chain has gas balance, or if
 * `accountAddress` is omitted. Returns nulls when no TVL data is available.
 */
export function useHighestTvlChain({
  currencyId,
  accountAddress,
}: {
  currencyId: string
  accountAddress?: Address
}): HighestTvlChainResult {
  const { data } = useTokenProjectTokensTvlPartsFragment({ currencyId })
  const projectTokens = data.project?.tokens

  // Only consider platform-supported chains. Mobile doesn't support non-EVM chains.
  const { chains: enabledChainIds } = useEnabledChains({ platform: Platform.EVM })

  const sortedChains = useMemo<SortedChainEntry[]>(() => {
    if (!projectTokens?.length) {
      return []
    }
    const enabledChainIdSet = new Set(enabledChainIds)
    const entries: Array<SortedChainEntry & { tvl: number }> = []
    for (const token of projectTokens) {
      if (!token) {
        continue
      }
      const tvl = token.market?.totalValueLocked?.value ?? 0
      if (tvl <= 0) {
        continue
      }
      const chainId = fromGraphQLChain(token.chain)
      if (!chainId || !enabledChainIdSet.has(chainId)) {
        continue
      }
      entries.push({ chainId, address: token.address ?? null, tvl })
    }
    entries.sort((a, b) => b.tvl - a.tvl)
    return entries.map(({ chainId, address }) => ({ chainId, address }))
  }, [projectTokens, enabledChainIds])

  const gasCurrencyIds = useMemo(() => {
    if (!accountAddress) {
      return []
    }
    return sortedChains.map(({ chainId }) => getCurrencyId(getChainGasToken(chainId)))
  }, [accountAddress, sortedChains])

  const gasBalances = useBalances({ evmAddress: accountAddress, currencies: gasCurrencyIds })

  return useMemo(() => {
    if (!sortedChains.length) {
      return { chainId: null, address: null }
    }

    if (!accountAddress || !gasBalances?.length) {
      return sortedChains[0] ?? { chainId: null, address: null }
    }

    const chainsWithGas = new Set<UniverseChainId>()
    for (const balance of gasBalances) {
      if (balance.quantity > 0) {
        chainsWithGas.add(balance.currencyInfo.currency.chainId)
      }
    }
    const chainWithGas = sortedChains.find(({ chainId }) => chainsWithGas.has(chainId))

    return chainWithGas ?? sortedChains[0] ?? { chainId: null, address: null }
  }, [sortedChains, accountAddress, gasBalances])
}
