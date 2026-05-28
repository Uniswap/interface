import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import i18n from 'uniswap/src/i18n'

import { parseMorphoMarketEntityId, parseMorphoVaultEntityId } from 'pages/Markets/data/ids'
import { mapMorphoMarketEntity, mapMorphoVaultEntity } from 'pages/Markets/data/mappers'
import { useMorphoMarketOnchainData, useMorphoVaultOnchainData } from 'pages/Markets/data/morphoReads'
import { MORPHO_MARKET_BROWSE_REGISTRY, MORPHO_VAULT_BROWSE_REGISTRY } from 'pages/Markets/data/registry'
import type {
  LendingBrowseResult,
  LendingBrowseStat,
  LendingMarketBrowseEntity,
  LendingMarketDetailEntity,
  LendingVaultBrowseEntity,
  LendingVaultDetailEntity,
} from 'pages/Markets/types'

function useResolvedMarketDetails(entityIds?: readonly string[]): LendingMarketDetailEntity[] {
  const onchainData = useMorphoMarketOnchainData(entityIds)

  return useMemo(
    () =>
      MORPHO_MARKET_BROWSE_REGISTRY.map((entry) => {
        const item = onchainData[entry.entityId]
        return item ? mapMorphoMarketEntity(entry.entityId, item) : undefined
      }).filter((item): item is LendingMarketDetailEntity => Boolean(item)),
    [onchainData],
  )
}

function useResolvedVaultDetails(entityIds?: readonly string[]): LendingVaultDetailEntity[] {
  const onchainData = useMorphoVaultOnchainData(entityIds)

  return useMemo(
    () =>
      MORPHO_VAULT_BROWSE_REGISTRY.map((entry) => {
        const item = onchainData[entry.entityId]
        return item ? mapMorphoVaultEntity(entry.entityId, item) : undefined
      }).filter((item): item is LendingVaultDetailEntity => Boolean(item)),
    [onchainData],
  )
}

function matchesMarketQuery(market: LendingMarketBrowseEntity, query: string): boolean {
  if (!query) {
    return true
  }

  return `${market.loanAsset.symbol} ${market.collateralAsset.symbol} ${market.chainLabel}`
    .toLowerCase()
    .includes(query)
}

function matchesVaultQuery(vault: LendingVaultBrowseEntity, query: string): boolean {
  if (!query) {
    return true
  }

  return `${vault.title} ${vault.asset.symbol} ${vault.chainLabel} ${vault.curator ?? ''}`.toLowerCase().includes(query)
}

function weightedAverage<T>(
  items: readonly T[],
  getValue: (item: T) => number,
  getWeight: (item: T) => number,
): number {
  const totals = items.reduce(
    (accumulator, item) => {
      const value = getValue(item)
      const weight = Math.max(0, getWeight(item))

      if (!Number.isFinite(value) || !Number.isFinite(weight) || weight === 0) {
        return accumulator
      }

      return {
        weightedValue: accumulator.weightedValue + value * weight,
        totalWeight: accumulator.totalWeight + weight,
      }
    },
    { weightedValue: 0, totalWeight: 0 },
  )

  if (totals.totalWeight > 0) {
    return totals.weightedValue / totals.totalWeight
  }

  return items.reduce((sum, item) => sum + getValue(item), 0) / Math.max(items.length, 1)
}

function buildMarketsBrowseStats(items: readonly LendingMarketBrowseEntity[]): LendingBrowseStat[] {
  const knownLiquidityUsd = items.reduce((sum, market) => sum + (market.liquidityUsd ?? 0), 0)

  return [
    {
      label: knownLiquidityUsd > 0 ? i18n.t('common.knownLiquidity') : i18n.t('common.lendingMarkets'),
      value: knownLiquidityUsd > 0 ? knownLiquidityUsd : items.length,
      type: knownLiquidityUsd > 0 ? 'fiat' : 'count',
    },
    {
      label: i18n.t('common.supplyApy'),
      value: weightedAverage(
        items,
        (market) => market.supplyApy,
        (market) => market.totalSupply,
      ),
      type: 'percent',
    },
    {
      label: i18n.t('common.borrowApy'),
      value: weightedAverage(
        items,
        (market) => market.borrowApy,
        (market) => market.totalBorrow,
      ),
      type: 'percent',
    },
  ]
}

function buildVaultsBrowseStats(items: readonly LendingVaultBrowseEntity[]): LendingBrowseStat[] {
  const knownDepositsUsd = items.reduce((sum, vault) => sum + (vault.totalAssetsUsd ?? 0), 0)

  return [
    {
      label: knownDepositsUsd > 0 ? i18n.t('common.knownDeposits') : i18n.t('common.vaults'),
      value: knownDepositsUsd > 0 ? knownDepositsUsd : items.length,
      type: knownDepositsUsd > 0 ? 'fiat' : 'count',
    },
    {
      label: i18n.t('common.netApy'),
      value: weightedAverage(
        items,
        (vault) => vault.apy,
        (vault) => vault.totalAssets,
      ),
      type: 'percent',
    },
    {
      label: i18n.t('common.vaults'),
      value: items.length,
      type: 'count',
    },
  ]
}

export function useLendingMarketsBrowse(searchValue: string): LendingBrowseResult<LendingMarketBrowseEntity> {
  const resolvedMarkets = useResolvedMarketDetails()
  const activeChainId = useAppSelector((state) => state.delegation.activeChainId)

  return useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()
    const catalog = activeChainId
      ? resolvedMarkets.filter((market) => market.chainId === activeChainId)
      : resolvedMarkets
    const items = [...catalog]
      .filter((market) => matchesMarketQuery(market, normalizedQuery))
      .sort((a, b) => (b.liquidityUsd ?? b.liquidity) - (a.liquidityUsd ?? a.liquidity))

    return {
      items,
      stats: buildMarketsBrowseStats(items),
    }
  }, [activeChainId, resolvedMarkets, searchValue])
}

export function useLendingVaultsBrowse(searchValue: string): LendingBrowseResult<LendingVaultBrowseEntity> {
  const resolvedVaults = useResolvedVaultDetails()
  const activeChainId = useAppSelector((state) => state.delegation.activeChainId)

  return useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()
    const catalog = activeChainId ? resolvedVaults.filter((vault) => vault.chainId === activeChainId) : resolvedVaults
    const items = [...catalog]
      .filter((vault) => matchesVaultQuery(vault, normalizedQuery))
      .sort((a, b) => (b.totalAssetsUsd ?? b.totalAssets) - (a.totalAssetsUsd ?? a.totalAssets))

    return {
      items,
      stats: buildVaultsBrowseStats(items),
    }
  }, [activeChainId, resolvedVaults, searchValue])
}

export function useLendingMarketDetails(
  marketId?: string,
  _chainName?: string,
): { market?: LendingMarketDetailEntity; isLoading: boolean } {
  const resolvedMarkets = useResolvedMarketDetails(marketId ? [marketId] : undefined)
  const isMorphoMarket = Boolean(parseMorphoMarketEntityId(marketId))
  const isKnownMorphoMarket = Boolean(
    marketId && MORPHO_MARKET_BROWSE_REGISTRY.some((entry) => entry.entityId === marketId),
  )

  return useMemo(
    () => ({
      market: isMorphoMarket ? resolvedMarkets.find((market) => market.id === marketId) : undefined,
      isLoading: isMorphoMarket && isKnownMorphoMarket && resolvedMarkets.length === 0,
    }),
    [isKnownMorphoMarket, isMorphoMarket, marketId, resolvedMarkets],
  )
}

export function useLendingVaultDetails(
  vaultId?: string,
  _chainName?: string,
): { vault?: LendingVaultDetailEntity; isLoading: boolean } {
  const resolvedVaults = useResolvedVaultDetails(vaultId ? [vaultId] : undefined)
  const isMorphoVault = Boolean(parseMorphoVaultEntityId(vaultId))
  const isKnownMorphoVault = Boolean(
    vaultId && MORPHO_VAULT_BROWSE_REGISTRY.some((entry) => entry.entityId === vaultId),
  )

  return useMemo(
    () => ({
      vault: isMorphoVault ? resolvedVaults.find((vault) => vault.id === vaultId) : undefined,
      isLoading: isMorphoVault && isKnownMorphoVault && resolvedVaults.length === 0,
    }),
    [isKnownMorphoVault, isMorphoVault, resolvedVaults, vaultId],
  )
}
