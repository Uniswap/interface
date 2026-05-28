/* eslint-disable import/no-unused-modules */

import { UniverseChainId } from 'uniswap/src/features/chains/types'

import { createMorphoMarketEntityId, createMorphoVaultEntityId } from 'pages/Markets/data/ids'
import {
  FEWTOKEN_ROUTER_MORPHO_ADDRESS,
  MORPHO_DEMO_CHAIN_ID,
  MORPHO_MAINNET_ADDRESS,
  MORPHO_MARKET_CONFIGS,
  MORPHO_VAULT_CONFIGS,
  type MorphoAddress,
  type MorphoMarketId,
  type MorphoTokenKey,
} from 'pages/Markets/protocol/morpho/config'
import {
  FEWTOKEN_MAINNET_EXECUTION_MARKETS,
  FEWTOKEN_MAINNET_EXECUTION_VAULTS,
} from 'pages/Markets/protocol/morpho/mainnetExecution'
import type { LendingMarketDetailEntity, LendingVaultDetailEntity } from 'pages/Markets/types'

export interface MorphoMarketRegistryEntry {
  entityId: string
  chainId: UniverseChainId
  morphoAddress: MorphoAddress
  marketId: MorphoMarketId
}

export interface MorphoMarketExecutionRegistryEntry extends MorphoMarketRegistryEntry {
  collateralAssetKey: MorphoTokenKey
  loanAssetKey: MorphoTokenKey
}

export interface MorphoVaultRegistryEntry {
  entityId: string
  chainId: UniverseChainId
  morphoAddress: MorphoAddress
  vaultAddress: MorphoAddress
}

export interface MorphoVaultExecutionRegistryEntry extends MorphoVaultRegistryEntry {
  assetKey: MorphoTokenKey
}

export const MORPHO_TESTNET_MARKET_BROWSE_REGISTRY: readonly MorphoMarketRegistryEntry[] = [
  ...MORPHO_MARKET_CONFIGS.map((market) => ({
    entityId: createMorphoMarketEntityId(MORPHO_DEMO_CHAIN_ID, market.id),
    chainId: MORPHO_DEMO_CHAIN_ID,
    morphoAddress: FEWTOKEN_ROUTER_MORPHO_ADDRESS,
    marketId: market.id,
  })),
]

// Market IDs come from PrintMarketIds.s.sol output. Keep in sync with mainnetExecution.ts.
// TODO: replace the '0x' placeholders with the real market IDs once PrintMarketIds is run.
const FEWTOKEN_MAINNET_MARKET_IDS: readonly MorphoMarketId[] = [
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[0]?.marketId ?? '0x', // fwWETH/fwUSDC
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[1]?.marketId ?? '0x', // fwWETH/fwUSDT
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[2]?.marketId ?? '0x', // fwWETH/fwDAI
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[3]?.marketId ?? '0x', // fwBTC/fwUSDC
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[4]?.marketId ?? '0x', // fwBTC/fwUSDT
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[5]?.marketId ?? '0x', // fwBTC/fwDAI
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[6]?.marketId ?? '0x', // fwUNI/fwUSDC
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[7]?.marketId ?? '0x', // fwUNI/fwUSDT
  FEWTOKEN_MAINNET_EXECUTION_MARKETS[8]?.marketId ?? '0x', // fwUNI/fwDAI
]

export const MORPHO_MAINNET_MARKET_BROWSE_REGISTRY: readonly MorphoMarketRegistryEntry[] = [
  ...FEWTOKEN_MAINNET_MARKET_IDS.filter((id) => id !== '0x').map((marketId) => ({
    entityId: createMorphoMarketEntityId(UniverseChainId.Mainnet, marketId),
    chainId: UniverseChainId.Mainnet,
    morphoAddress: MORPHO_MAINNET_ADDRESS,
    marketId,
  })),
]

export const MORPHO_TESTNET_VAULT_BROWSE_REGISTRY: readonly MorphoVaultRegistryEntry[] = [
  ...MORPHO_VAULT_CONFIGS.map((vault) => ({
    entityId: createMorphoVaultEntityId(MORPHO_DEMO_CHAIN_ID, vault.address),
    chainId: MORPHO_DEMO_CHAIN_ID,
    morphoAddress: FEWTOKEN_ROUTER_MORPHO_ADDRESS,
    vaultAddress: vault.address,
  })),
]

export const MORPHO_MAINNET_VAULT_BROWSE_REGISTRY: readonly MorphoVaultRegistryEntry[] = [
  ...FEWTOKEN_MAINNET_EXECUTION_VAULTS.map((vault) => ({
    entityId: createMorphoVaultEntityId(UniverseChainId.Mainnet, vault.vaultAddress),
    chainId: UniverseChainId.Mainnet,
    morphoAddress: MORPHO_MAINNET_ADDRESS,
    vaultAddress: vault.vaultAddress,
  })),
]

export const MORPHO_TESTNET_MARKET_EXECUTION_REGISTRY: readonly MorphoMarketExecutionRegistryEntry[] = [
  ...MORPHO_MARKET_CONFIGS.map((market) => ({
    entityId: createMorphoMarketEntityId(MORPHO_DEMO_CHAIN_ID, market.id),
    chainId: MORPHO_DEMO_CHAIN_ID,
    morphoAddress: FEWTOKEN_ROUTER_MORPHO_ADDRESS,
    marketId: market.id,
    collateralAssetKey: market.collateralToken,
    loanAssetKey: market.loanToken,
  })),
]

export const MORPHO_TESTNET_VAULT_EXECUTION_REGISTRY: readonly MorphoVaultExecutionRegistryEntry[] = [
  ...MORPHO_VAULT_CONFIGS.map((vault) => ({
    entityId: createMorphoVaultEntityId(MORPHO_DEMO_CHAIN_ID, vault.address),
    chainId: MORPHO_DEMO_CHAIN_ID,
    morphoAddress: FEWTOKEN_ROUTER_MORPHO_ADDRESS,
    vaultAddress: vault.address,
    assetKey: vault.asset,
  })),
]

export function createMorphoMainnetMarketExecutionEntry(
  marketId: MorphoMarketId,
  collateralAssetKey: MorphoTokenKey,
  loanAssetKey: MorphoTokenKey,
): MorphoMarketExecutionRegistryEntry {
  return {
    entityId: createMorphoMarketEntityId(UniverseChainId.Mainnet, marketId),
    chainId: UniverseChainId.Mainnet,
    morphoAddress: MORPHO_MAINNET_ADDRESS,
    marketId,
    collateralAssetKey,
    loanAssetKey,
  }
}

export function createMorphoMainnetVaultExecutionEntry(
  vaultAddress: MorphoAddress,
  assetKey: MorphoTokenKey,
): MorphoVaultExecutionRegistryEntry {
  return {
    entityId: createMorphoVaultEntityId(UniverseChainId.Mainnet, vaultAddress),
    chainId: UniverseChainId.Mainnet,
    morphoAddress: MORPHO_MAINNET_ADDRESS,
    vaultAddress,
    assetKey,
  }
}

export const MORPHO_MAINNET_MARKET_EXECUTION_REGISTRY: readonly MorphoMarketExecutionRegistryEntry[] = [
  ...FEWTOKEN_MAINNET_EXECUTION_MARKETS.map((entry) =>
    createMorphoMainnetMarketExecutionEntry(
      entry.marketId,
      entry.collateralAssetKey as MorphoTokenKey,
      entry.loanAssetKey as MorphoTokenKey,
    ),
  ),
]

export const MORPHO_MAINNET_VAULT_EXECUTION_REGISTRY: readonly MorphoVaultExecutionRegistryEntry[] = [
  ...FEWTOKEN_MAINNET_EXECUTION_VAULTS.map((entry) =>
    createMorphoMainnetVaultExecutionEntry(entry.vaultAddress, entry.assetKey as MorphoTokenKey),
  ),
]

export const MORPHO_MARKET_BROWSE_REGISTRY: readonly MorphoMarketRegistryEntry[] = [
  ...MORPHO_TESTNET_MARKET_BROWSE_REGISTRY,
  ...MORPHO_MAINNET_MARKET_BROWSE_REGISTRY,
]

export const MORPHO_VAULT_BROWSE_REGISTRY: readonly MorphoVaultRegistryEntry[] = [
  ...MORPHO_TESTNET_VAULT_BROWSE_REGISTRY,
  ...MORPHO_MAINNET_VAULT_BROWSE_REGISTRY,
]

export const MORPHO_MARKET_REGISTRY: readonly MorphoMarketRegistryEntry[] = [
  ...MORPHO_MARKET_BROWSE_REGISTRY,
  ...MORPHO_MAINNET_MARKET_EXECUTION_REGISTRY,
]

export const MORPHO_VAULT_REGISTRY: readonly MorphoVaultRegistryEntry[] = [
  ...MORPHO_VAULT_BROWSE_REGISTRY,
  ...MORPHO_MAINNET_VAULT_EXECUTION_REGISTRY,
]

export const MORPHO_MARKET_ENTITY_BY_PROTOCOL_ID: Readonly<Record<MorphoMarketId, string>> = Object.freeze(
  MORPHO_MARKET_REGISTRY.reduce(
    (accumulator, entry) => ({
      ...accumulator,
      [entry.marketId]: entry.entityId,
    }),
    {} as Record<MorphoMarketId, string>,
  ),
)

function createMarketExecutionLookupKey(chainId: UniverseChainId, marketId: MorphoMarketId): string {
  return `${chainId}:${marketId.toLowerCase()}`
}

function createVaultExecutionLookupKey(chainId: UniverseChainId, vaultAddress: MorphoAddress): string {
  return `${chainId}:${vaultAddress.toLowerCase()}`
}

export const MORPHO_MARKET_EXECUTION_BY_LOOKUP_KEY: Readonly<
  Record<string, NonNullable<LendingMarketDetailEntity['morphoExecution']>>
> = Object.freeze(
  [...MORPHO_TESTNET_MARKET_EXECUTION_REGISTRY, ...MORPHO_MAINNET_MARKET_EXECUTION_REGISTRY].reduce<
    Record<string, NonNullable<LendingMarketDetailEntity['morphoExecution']>>
  >((accumulator, entry) => {
    accumulator[createMarketExecutionLookupKey(entry.chainId, entry.marketId)] = {
      kind: 'morpho',
      marketId: entry.marketId,
      collateralAssetKey: entry.collateralAssetKey,
      loanAssetKey: entry.loanAssetKey,
    }
    return accumulator
  }, {}),
)

export const MORPHO_VAULT_EXECUTION_BY_LOOKUP_KEY: Readonly<
  Record<string, NonNullable<LendingVaultDetailEntity['morphoExecution']>>
> = Object.freeze(
  [...MORPHO_TESTNET_VAULT_EXECUTION_REGISTRY, ...MORPHO_MAINNET_VAULT_EXECUTION_REGISTRY].reduce<
    Record<string, NonNullable<LendingVaultDetailEntity['morphoExecution']>>
  >((accumulator, entry) => {
    accumulator[createVaultExecutionLookupKey(entry.chainId, entry.vaultAddress)] = {
      kind: 'morpho',
      vaultAddress: entry.vaultAddress,
      assetKey: entry.assetKey,
    }
    return accumulator
  }, {}),
)

export function getMorphoAddressForMarket(entityId: string): MorphoAddress | undefined {
  return MORPHO_MARKET_BROWSE_REGISTRY.find((entry) => entry.entityId === entityId)?.morphoAddress
}

export function getMorphoMarketExecution(chainId: UniverseChainId, marketId: string) {
  return MORPHO_MARKET_EXECUTION_BY_LOOKUP_KEY[createMarketExecutionLookupKey(chainId, marketId as MorphoMarketId)]
}

export function getMorphoVaultExecution(chainId: UniverseChainId, vaultAddress: string) {
  return MORPHO_VAULT_EXECUTION_BY_LOOKUP_KEY[createVaultExecutionLookupKey(chainId, vaultAddress as MorphoAddress)]
}

export const MORPHO_EXECUTABLE_MARKET_ENTITY_IDS = Object.freeze(
  [...MORPHO_TESTNET_MARKET_EXECUTION_REGISTRY, ...MORPHO_MAINNET_MARKET_EXECUTION_REGISTRY].map((entry) =>
    createMorphoMarketEntityId(entry.chainId, entry.marketId),
  ),
)

export const MORPHO_EXECUTABLE_VAULT_ENTITY_IDS = Object.freeze(
  [...MORPHO_TESTNET_VAULT_EXECUTION_REGISTRY, ...MORPHO_MAINNET_VAULT_EXECUTION_REGISTRY].map((entry) =>
    createMorphoVaultEntityId(entry.chainId, entry.vaultAddress),
  ),
)
