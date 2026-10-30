import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import type { NetworkSelectorOption, TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilter/types'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'

function aggregateBalancesByChain(
  portfolioBalancesById: Record<string, PortfolioBalance>,
): Map<UniverseChainId, number> {
  const balanceByChain = new Map<UniverseChainId, number>()
  for (const balance of Object.values(portfolioBalancesById)) {
    if (balance.isHidden || balance.currencyInfo.isSpam) {
      continue
    }
    const chainId = toSupportedChainId(balance.currencyInfo.currency.chainId)
    if (!chainId) {
      continue
    }
    const current = balanceByChain.get(chainId) ?? 0
    balanceByChain.set(chainId, current + (balance.balanceUSD ?? 0))
  }
  return balanceByChain
}

function partitionChainsByBalance({
  chainIds,
  balanceByChain,
  lowLiquidityChainIds,
}: {
  chainIds: UniverseChainId[]
  balanceByChain: Map<UniverseChainId, number>
  lowLiquidityChainIds?: UniverseChainId[]
}): TieredNetworkOptions {
  const withBalances: NetworkSelectorOption[] = []
  const otherNetworks: NetworkSelectorOption[] = []
  const lowLiquidity: NetworkSelectorOption[] = []

  for (const chainId of chainIds) {
    const balanceUSD = balanceByChain.get(chainId) ?? 0
    const option = {
      chainId,
      label: getChainInfo(chainId).label,
      balanceUSD,
    }

    if (lowLiquidityChainIds?.includes(chainId)) {
      lowLiquidity.push(option)
    } else if (balanceUSD > 0) {
      withBalances.push(option)
    } else {
      otherNetworks.push(option)
    }
  }

  withBalances.sort((a, b) => b.balanceUSD - a.balanceUSD)

  return { withBalances, otherNetworks, lowLiquidity }
}

export function useNetworkSelectorOptions({
  addresses,
  chainIds,
  lowLiquidityChainIds,
  enabled = true,
}: {
  addresses: AddressGroup
  chainIds: UniverseChainId[]
  lowLiquidityChainIds?: UniverseChainId[]
  enabled?: boolean
}): TieredNetworkOptions | undefined {
  const { data: portfolioBalancesById } = usePortfolioBalancesForAddressById(addresses)

  return useMemo(() => {
    const hasLowLiquidityChains = Boolean(lowLiquidityChainIds?.length)
    if (!enabled || (!portfolioBalancesById && !hasLowLiquidityChains)) {
      return undefined
    }

    const balanceByChain = portfolioBalancesById ? aggregateBalancesByChain(portfolioBalancesById) : new Map()
    return partitionChainsByBalance({ chainIds, balanceByChain, lowLiquidityChainIds })
  }, [enabled, portfolioBalancesById, chainIds, lowLiquidityChainIds])
}
