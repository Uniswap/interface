import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getInitialLogoUrl } from 'utils/getInitialLogoURL'

import { createMorphoMarketEntityId } from 'pages/Markets/data/ids'
import { maybeToUsdValue, oraclePriceToQuoteTokenAmount } from 'pages/Markets/data/morphoPricing'
import type {
  MorphoMarketOnchainData,
  MorphoTokenMetadata,
  MorphoVaultOnchainData,
} from 'pages/Markets/data/morphoReads'
import { getMorphoMarketExecution, getMorphoVaultExecution } from 'pages/Markets/data/registry'
import { MORPHO_ASSET_ADAPTERS } from 'pages/Markets/protocol/morpho/config'
import type {
  LendingAssetMetadata,
  LendingMarketDetailEntity,
  LendingVaultAllocation,
  LendingVaultDetailEntity,
} from 'pages/Markets/types'

function bigintToTokenNumber(value: bigint, decimals: number): number {
  return Number(value) / 10 ** decimals
}

function clampToPositive(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, value)
}

function clampToUnitInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(value, 1))
}

function ratePerSecondToApy(ratePerSecond?: bigint): number {
  if (typeof ratePerSecond !== 'bigint') {
    return 0
  }

  return clampToPositive((Number(ratePerSecond) * 31_536_000) / 1e18)
}

function getDisplayTokenMetadata(asset: MorphoTokenMetadata): MorphoTokenMetadata {
  const adapter = Object.values(MORPHO_ASSET_ADAPTERS).find(
    (entry) => entry.protocol.address.toLowerCase() === asset.address.toLowerCase(),
  )

  return adapter?.underlying ?? asset
}

function toAssetMetadata(asset: MorphoTokenMetadata, chainId: number): LendingAssetMetadata {
  const displayAsset = getDisplayTokenMetadata(asset)
  const displayAssetWithLogo = displayAsset as MorphoTokenMetadata & {
    logoAddress?: string
    logoChainId?: number
  }

  return {
    symbol: displayAsset.symbol,
    name: displayAsset.name,
    address: displayAsset.address,
    decimals: displayAsset.decimals,
    logoUrl:
      getInitialLogoUrl(
        displayAssetWithLogo.logoAddress ?? displayAsset.address,
        displayAssetWithLogo.logoChainId ?? chainId,
      ) ?? '',
  }
}

function toDisplayTokenAmount(value: bigint, asset: MorphoTokenMetadata): number {
  return bigintToTokenNumber(value, getDisplayTokenMetadata(asset).decimals)
}

function normalizeDisplayText(value: string): string {
  return Object.values(MORPHO_ASSET_ADAPTERS).reduce((currentValue, adapter) => {
    return currentValue
      .replaceAll(adapter.protocol.symbol, adapter.underlying.symbol)
      .replaceAll(adapter.protocol.name, adapter.underlying.name)
      .replaceAll('Fewtoken', '')
      .replaceAll('  ', ' ')
      .trim()
  }, value)
}

function toCuratorLabel(curator?: `0x${string}`): string | undefined {
  if (!curator) {
    return undefined
  }

  return `${curator.slice(0, 6)}...${curator.slice(-4)}`
}

export function mapMorphoMarketEntity(entityId: string, onchain: MorphoMarketOnchainData): LendingMarketDetailEntity {
  const chainLabel = getChainInfo(onchain.chainId).label
  const displayLoanAsset = getDisplayTokenMetadata(onchain.loanAsset)
  const totalSupply = toDisplayTokenAmount(onchain.marketState.totalSupplyAssets, onchain.loanAsset)
  const totalBorrow = toDisplayTokenAmount(onchain.marketState.totalBorrowAssets, onchain.loanAsset)
  const liquidity = clampToPositive(totalSupply - totalBorrow)
  const utilization = totalSupply > 0 ? clampToUnitInterval(totalBorrow / totalSupply) : 0
  const borrowApy = ratePerSecondToApy(onchain.borrowRatePerSecond)
  const feeRate = Number(onchain.marketState.fee) / 1e18
  const supplyApy = clampToPositive(borrowApy * utilization * (1 - feeRate))
  const totalSupplyUsd = maybeToUsdValue(totalSupply, onchain.chainId, displayLoanAsset.address)
  const totalBorrowUsd = maybeToUsdValue(totalBorrow, onchain.chainId, displayLoanAsset.address)
  const liquidityUsd = maybeToUsdValue(liquidity, onchain.chainId, displayLoanAsset.address)
  const oraclePrice = oraclePriceToQuoteTokenAmount(
    onchain.oraclePrice,
    getDisplayTokenMetadata(onchain.collateralAsset).decimals,
    displayLoanAsset.decimals,
  )
  const morphoExecution = getMorphoMarketExecution(onchain.chainId, onchain.marketId)

  return {
    id: entityId,
    chainId: onchain.chainId,
    chainLabel,
    marketId: onchain.marketId,
    loanAsset: toAssetMetadata(onchain.loanAsset, onchain.chainId),
    collateralAsset: toAssetMetadata(onchain.collateralAsset, onchain.chainId),
    supplyApy,
    borrowApy,
    lltv: Number(onchain.marketParams.lltv) / 1e18,
    feeRate,
    utilization,
    totalSupply,
    totalSupplyUsd,
    totalBorrow,
    totalBorrowUsd,
    liquidity,
    liquidityUsd,
    oracleAddress: onchain.marketParams.oracle,
    oraclePrice,
    oraclePriceRaw: onchain.oraclePrice,
    lltvRaw: onchain.marketParams.lltv,
    irmAddress: onchain.marketParams.irm,
    lastUpdate: Number(onchain.marketState.lastUpdate),
    ...(morphoExecution ? { morphoExecution } : {}),
  }
}

export function mapMorphoVaultEntity(entityId: string, onchain: MorphoVaultOnchainData): LendingVaultDetailEntity {
  const chainLabel = getChainInfo(onchain.chainId).label
  const displayVaultAsset = getDisplayTokenMetadata(onchain.asset)
  const totalAssets = toDisplayTokenAmount(onchain.totalAssets, onchain.asset)
  const totalAssetsUsd = maybeToUsdValue(totalAssets, onchain.chainId, displayVaultAsset.address)
  const idleAssets = toDisplayTokenAmount(onchain.idleAssets, onchain.asset)
  const idleAssetsUsd = maybeToUsdValue(idleAssets, onchain.chainId, displayVaultAsset.address)
  const capacity = toDisplayTokenAmount(onchain.capacityAssets, onchain.asset)
  const capacityUsd = maybeToUsdValue(capacity, onchain.chainId, displayVaultAsset.address)
  const totalSupplyShares = bigintToTokenNumber(onchain.totalSupplyShares, onchain.decimals)
  const allocatedAssetsTotal = onchain.allocations.reduce((sum, allocation) => sum + allocation.suppliedAssets, 0n)
  const morphoExecution = getMorphoVaultExecution(onchain.chainId, onchain.vaultAddress)

  const allocations: LendingVaultAllocation[] = onchain.allocations
    .filter((allocation) => allocation.suppliedAssets > 0n || allocation.cap > 0n)
    .map((allocation) => {
      const suppliedAssets = toDisplayTokenAmount(allocation.suppliedAssets, onchain.asset)
      const capAssets = toDisplayTokenAmount(allocation.cap, onchain.asset)
      const label = allocation.market
        ? `${getDisplayTokenMetadata(allocation.market.loanAsset).symbol} / ${getDisplayTokenMetadata(allocation.market.collateralAsset).symbol}`
        : allocation.marketId
      const share = allocatedAssetsTotal > 0n ? Number(allocation.suppliedAssets) / Number(allocatedAssetsTotal) : 0

      return {
        marketId: createMorphoMarketEntityId(onchain.chainId, allocation.marketId),
        label,
        share: clampToUnitInterval(share),
        suppliedAssets,
        suppliedAssetsUsd: maybeToUsdValue(suppliedAssets, onchain.chainId, displayVaultAsset.address),
        capAssets,
        capAssetsUsd: maybeToUsdValue(capAssets, onchain.chainId, displayVaultAsset.address),
        enabled: allocation.enabled,
      }
    })

  return {
    id: entityId,
    chainId: onchain.chainId,
    chainLabel,
    vaultAddress: onchain.vaultAddress,
    title: normalizeDisplayText(onchain.title),
    asset: toAssetMetadata(onchain.asset, onchain.chainId),
    apy: onchain.apy,
    totalAssets,
    totalAssetsUsd,
    idleAssets,
    idleAssetsUsd,
    curator: toCuratorLabel(onchain.curator),
    capacity,
    capacityUsd,
    sharePrice: bigintToTokenNumber(onchain.sharePriceAssetsPerShare ?? 0n, onchain.asset.decimals),
    totalSupplyShares,
    feeRate: Number(onchain.fee ?? 0n) / 1e18,
    allocations,
    ...(morphoExecution ? { morphoExecution } : {}),
  }
}
