import { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface LendingAssetMetadata {
  symbol: string
  name: string
  address: string
  logoUrl: string
  decimals: number
}

export interface LendingMarketBrowseEntity {
  id: string
  chainId: UniverseChainId
  chainLabel: string
  marketId: `0x${string}`
  loanAsset: LendingAssetMetadata
  collateralAsset: LendingAssetMetadata
  supplyApy: number
  borrowApy: number
  lltv: number
  feeRate: number
  utilization: number
  totalSupply: number
  totalSupplyUsd?: number
  totalBorrow: number
  totalBorrowUsd?: number
  liquidity: number
  liquidityUsd?: number
  oracleAddress: `0x${string}`
  oraclePrice?: number
  oraclePriceRaw?: bigint
  lltvRaw: bigint
  irmAddress: `0x${string}`
  lastUpdate: number
}

export interface LendingMarketDetailEntity extends LendingMarketBrowseEntity {
  morphoExecution?: {
    kind: 'morpho'
    marketId: `0x${string}`
    collateralAssetKey: string
    loanAssetKey: string
  }
}

export interface LendingVaultBrowseEntity {
  id: string
  chainId: UniverseChainId
  chainLabel: string
  vaultAddress: `0x${string}`
  title: string
  asset: LendingAssetMetadata
  apy: number
  totalAssets: number
  totalAssetsUsd?: number
  idleAssets: number
  idleAssetsUsd?: number
  curator?: string
  capacity: number
  capacityUsd?: number
  sharePrice: number
  totalSupplyShares: number
  feeRate: number
}

export interface LendingVaultAllocation {
  marketId: string
  label: string
  share: number
  suppliedAssets: number
  suppliedAssetsUsd?: number
  capAssets: number
  capAssetsUsd?: number
  enabled: boolean
}

export interface LendingVaultDetailEntity extends LendingVaultBrowseEntity {
  allocations: LendingVaultAllocation[]
  morphoExecution?: {
    kind: 'morpho'
    vaultAddress: `0x${string}`
    assetKey: string
  }
}

export interface LendingBrowseStat {
  label: string
  value: number
  type: 'fiat' | 'percent' | 'count' | 'token'
  symbol?: string
}

export interface LendingBrowseResult<TBrowse> {
  items: TBrowse[]
  stats: LendingBrowseStat[]
}
