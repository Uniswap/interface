import { useMemo } from 'react'
import type { NetworkSelectorOption, TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
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

function partitionChainsByBalance(
  chainIds: UniverseChainId[],
  balanceByChain: Map<UniverseChainId, number>,
): TieredNetworkOptions {
  const withBalances: NetworkSelectorOption[] = []
  const otherNetworks: NetworkSelectorOption[] = []

  for (const chainId of chainIds) {
    const balanceUSD = balanceByChain.get(chainId) ?? 0
    const option = {
      chainId,
      label: getChainInfo(chainId).label,
      balanceUSD,
    }

    if (balanceUSD > 0) {
      withBalances.push(option)
    } else {
      otherNetworks.push(option)
    }
  }

  withBalances.sort((a, b) => b.balanceUSD - a.balanceUSD)

  return { withBalances, otherNetworks }
}

export function useNetworkSelectorOptions({
  addresses,
  chainIds,
  enabled = true,
}: {
  addresses: AddressGroup
  chainIds: UniverseChainId[]
  enabled?: boolean
}): TieredNetworkOptions | undefined {
  const { data: portfolioBalancesById } = usePortfolioBalancesForAddressById(addresses)

  return useMemo(() => {
    // If network filter is not enabled or there are no portfolio balances, return undefined
    if (!enabled || !portfolioBalancesById) {
      return undefined
    }

    const balanceByChain = aggregateBalancesByChain(portfolioBalancesById)
    return partitionChainsByBalance(chainIds, balanceByChain)
  }, [enabled, portfolioBalancesById, chainIds])
}
