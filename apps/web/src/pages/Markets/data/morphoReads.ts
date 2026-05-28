import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { assume0xAddress } from 'utils/wagmi'
import { getAddress, isAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import {
  MORPHO_MARKET_BROWSE_REGISTRY,
  MORPHO_VAULT_BROWSE_REGISTRY,
  type MorphoMarketRegistryEntry,
  type MorphoVaultRegistryEntry,
} from 'pages/Markets/data/registry'
import { ERC20_ABI, IRM_ABI, MORPHO_ABI, ORACLE_ABI, VAULT_ABI } from 'pages/Markets/protocol/morpho/abi'

type Address = `0x${string}`

interface MarketParamsShape {
  loanToken: Address
  collateralToken: Address
  oracle: Address
  irm: Address
  lltv: bigint
}

interface MarketStateShape {
  totalSupplyAssets: bigint
  totalSupplyShares: bigint
  totalBorrowAssets: bigint
  totalBorrowShares: bigint
  lastUpdate: bigint
  fee: bigint
}

interface VaultConfigShape {
  cap: bigint
  enabled: boolean
  removableAt: bigint
}

export interface MorphoTokenMetadata {
  address: Address
  symbol: string
  name: string
  decimals: number
}

export interface MorphoMarketOnchainData {
  chainId: number
  marketId: Address
  loanAsset: MorphoTokenMetadata
  collateralAsset: MorphoTokenMetadata
  marketParams: MarketParamsShape
  marketState: MarketStateShape
  borrowRatePerSecond?: bigint
  oraclePrice?: bigint
}

interface MorphoVaultAllocationOnchainData {
  marketId: Address
  suppliedAssets: bigint
  cap: bigint
  enabled: boolean
  market?: MorphoMarketOnchainData
}

export interface MorphoVaultOnchainData {
  chainId: number
  vaultAddress: Address
  title: string
  symbol?: string
  decimals: number
  asset: MorphoTokenMetadata
  totalAssets: bigint
  totalSupplyShares: bigint
  idleAssets: bigint
  curator?: Address
  fee?: bigint
  sharePriceAssetsPerShare?: bigint
  apy: number
  allocations: MorphoVaultAllocationOnchainData[]
  capacityAssets: bigint
}

function filterRegistry<T extends { entityId: string }>(
  entries: readonly T[],
  entityIds?: readonly string[],
): readonly T[] {
  if (!entityIds?.length) {
    return entries
  }

  const idSet = new Set(entityIds)
  return entries.filter((entry) => idSet.has(entry.entityId))
}

function readNamedValue<T>(value: unknown, index: number, key: string): T | undefined {
  if (Array.isArray(value)) {
    return value[index] as T | undefined
  }

  if (value && typeof value === 'object' && key in value) {
    return (value as Record<string, T | undefined>)[key]
  }

  return undefined
}

function toMarketParams(value: unknown): MarketParamsShape | undefined {
  const loanToken = readNamedValue<Address>(value, 0, 'loanToken')
  const collateralToken = readNamedValue<Address>(value, 1, 'collateralToken')
  const oracle = readNamedValue<Address>(value, 2, 'oracle')
  const irm = readNamedValue<Address>(value, 3, 'irm')
  const lltv = readNamedValue<bigint>(value, 4, 'lltv')

  if (!loanToken || !collateralToken || !oracle || !irm || typeof lltv !== 'bigint') {
    return undefined
  }

  return { loanToken, collateralToken, oracle, irm, lltv }
}

function toMarketState(value: unknown): MarketStateShape | undefined {
  const totalSupplyAssets = readNamedValue<bigint>(value, 0, 'totalSupplyAssets')
  const totalSupplyShares = readNamedValue<bigint>(value, 1, 'totalSupplyShares')
  const totalBorrowAssets = readNamedValue<bigint>(value, 2, 'totalBorrowAssets')
  const totalBorrowShares = readNamedValue<bigint>(value, 3, 'totalBorrowShares')
  const lastUpdate = readNamedValue<bigint>(value, 4, 'lastUpdate')
  const fee = readNamedValue<bigint>(value, 5, 'fee')

  if (
    typeof totalSupplyAssets !== 'bigint' ||
    typeof totalSupplyShares !== 'bigint' ||
    typeof totalBorrowAssets !== 'bigint' ||
    typeof totalBorrowShares !== 'bigint' ||
    typeof lastUpdate !== 'bigint' ||
    typeof fee !== 'bigint'
  ) {
    return undefined
  }

  return {
    totalSupplyAssets,
    totalSupplyShares,
    totalBorrowAssets,
    totalBorrowShares,
    lastUpdate,
    fee,
  }
}

function toVaultConfig(value: unknown): VaultConfigShape | undefined {
  const cap = readNamedValue<bigint>(value, 0, 'cap')
  const enabled = readNamedValue<boolean>(value, 1, 'enabled')
  const removableAt = readNamedValue<bigint>(value, 2, 'removableAt')

  if (typeof cap !== 'bigint' || typeof enabled !== 'boolean' || typeof removableAt !== 'bigint') {
    return undefined
  }

  return { cap, enabled, removableAt }
}

function getSuccessfulResult<T>(result: { status: string; result?: T } | undefined): T | undefined {
  return result?.status === 'success' ? result.result : undefined
}

function toAddress(value: unknown): Address | undefined {
  if (typeof value !== 'string' || !isAddress(value)) {
    return undefined
  }

  return getAddress(value)
}

function clampToPositive(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, value)
}

function ratePerSecondToApy(ratePerSecond?: bigint): number | undefined {
  if (typeof ratePerSecond !== 'bigint') {
    return undefined
  }

  return clampToPositive((Number(ratePerSecond) * 31_536_000) / 1e18)
}

function wadToFraction(value?: bigint): number {
  return typeof value === 'bigint' ? Number(value) / 1e18 : 0
}

function scaleSupplySharesToAssets(supplyShares: bigint, marketState: MarketStateShape | undefined): bigint {
  if (
    !marketState ||
    supplyShares === 0n ||
    marketState.totalSupplyShares === 0n ||
    marketState.totalSupplyAssets === 0n
  ) {
    return 0n
  }

  return (supplyShares * marketState.totalSupplyAssets) / marketState.totalSupplyShares
}

function shortAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function buildTokenMetadataContracts(items: readonly { chainId: number; address?: Address }[]) {
  const entryIndexes: number[] = []

  const contracts = items.flatMap((item, index) => {
    if (!item.address) {
      return []
    }

    entryIndexes.push(index)

    return [
      { address: item.address, abi: ERC20_ABI, functionName: 'symbol', chainId: item.chainId } as const,
      { address: item.address, abi: ERC20_ABI, functionName: 'name', chainId: item.chainId } as const,
      { address: item.address, abi: ERC20_ABI, functionName: 'decimals', chainId: item.chainId } as const,
    ]
  })

  return { contracts, entryIndexes }
}

function readTokenMetadata(
  items: readonly { chainId: number; address?: Address }[],
  payload: ReturnType<typeof buildTokenMetadataContracts>,
  results: readonly ({ status: string; result?: unknown } | undefined)[] | undefined,
  itemIndex: number,
): MorphoTokenMetadata | undefined {
  const payloadIndex = payload.entryIndexes.indexOf(itemIndex)
  const address = items[itemIndex]?.address
  if (payloadIndex === -1 || !address) {
    return undefined
  }

  const offset = payloadIndex * 3
  const symbol = getSuccessfulResult(results?.[offset]) as string | undefined
  const name = getSuccessfulResult(results?.[offset + 1]) as string | undefined
  const decimals = getSuccessfulResult(results?.[offset + 2]) as number | undefined

  if (!symbol || !name || typeof decimals !== 'number') {
    return undefined
  }

  return { address, symbol, name, decimals }
}

function buildMarketIrmContracts(
  entries: readonly MorphoMarketRegistryEntry[],
  paramsByIndex: readonly (MarketParamsShape | undefined)[],
  statesByIndex: readonly (MarketStateShape | undefined)[],
) {
  const entryIndexes: number[] = []

  const contracts = entries.flatMap((entry, index) => {
    const marketParams = paramsByIndex[index]
    const marketState = statesByIndex[index]
    if (!marketParams || !marketState) {
      return []
    }

    entryIndexes.push(index)
    return [
      {
        address: marketParams.irm,
        abi: IRM_ABI,
        functionName: 'borrowRateView',
        args: [marketParams, marketState] as const,
        chainId: entry.chainId,
      } as const,
    ]
  })

  return { contracts, entryIndexes }
}

function buildOraclePriceContracts(
  entries: readonly MorphoMarketRegistryEntry[],
  paramsByIndex: readonly (MarketParamsShape | undefined)[],
) {
  const entryIndexes: number[] = []

  const contracts = entries.flatMap((entry, index) => {
    const marketParams = paramsByIndex[index]
    if (!marketParams) {
      return []
    }

    entryIndexes.push(index)
    return [{ address: marketParams.oracle, abi: ORACLE_ABI, functionName: 'price', chainId: entry.chainId } as const]
  })

  return { contracts, entryIndexes }
}

function buildVaultQueueContracts(
  entries: readonly MorphoVaultRegistryEntry[],
  queueLengthData: readonly ({ status: string; result?: bigint } | undefined)[] | undefined,
) {
  const entryIndexes: number[] = []

  const contracts = entries.flatMap((entry, entryIndex) => {
    const queueLength = getSuccessfulResult(queueLengthData?.[entryIndex]) ?? 0n

    return Array.from({ length: Number(queueLength) }, (_unused, queuePosition) => {
      entryIndexes.push(entryIndex)
      return {
        address: entry.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'supplyQueue',
        args: [BigInt(queuePosition)] as const,
        chainId: entry.chainId,
      } as const
    })
  })

  return { contracts, entryIndexes }
}

function getQueueIdsByEntry(
  entries: readonly MorphoVaultRegistryEntry[],
  queueContracts: ReturnType<typeof buildVaultQueueContracts>,
  queueData: readonly ({ status: string; result?: Address } | undefined)[] | undefined,
): Address[][] {
  const queueIdsByEntry: Address[][] = entries.map(() => [])

  queueContracts.entryIndexes.forEach((entryIndex, contractIndex) => {
    const marketId = getSuccessfulResult(queueData?.[contractIndex])
    if (!marketId || queueIdsByEntry[entryIndex]?.includes(marketId)) {
      return
    }

    queueIdsByEntry[entryIndex]?.push(marketId)
  })

  return queueIdsByEntry
}

function buildVaultAllocationContracts(
  entries: readonly MorphoVaultRegistryEntry[],
  queueIdsByEntry: readonly Address[][],
) {
  const configContracts = entries.flatMap((entry, entryIndex) =>
    queueIdsByEntry[entryIndex].map((marketId) => ({
      address: entry.vaultAddress,
      abi: VAULT_ABI,
      functionName: 'config',
      args: [marketId] as const,
      chainId: entry.chainId,
    })),
  )

  const positionContracts = entries.flatMap((entry, entryIndex) =>
    queueIdsByEntry[entryIndex].map((marketId) => ({
      address: entry.morphoAddress,
      abi: MORPHO_ABI,
      functionName: 'position',
      args: [marketId, entry.vaultAddress] as const,
      chainId: entry.chainId,
    })),
  )

  const marketContracts = entries.flatMap((entry, entryIndex) =>
    queueIdsByEntry[entryIndex].map((marketId) => ({
      address: entry.morphoAddress,
      abi: MORPHO_ABI,
      functionName: 'market',
      args: [marketId] as const,
      chainId: entry.chainId,
    })),
  )

  const marketParamsContracts = entries.flatMap((entry, entryIndex) =>
    queueIdsByEntry[entryIndex].map((marketId) => ({
      address: entry.morphoAddress,
      abi: MORPHO_ABI,
      functionName: 'idToMarketParams',
      args: [marketId] as const,
      chainId: entry.chainId,
    })),
  )

  return { configContracts, positionContracts, marketContracts, marketParamsContracts }
}

function buildNestedMarketIrmContracts(
  entries: readonly MorphoVaultRegistryEntry[],
  queueIdsByEntry: readonly Address[][],
  marketParamsData: readonly ({ status: string; result?: unknown } | undefined)[] | undefined,
  marketData: readonly ({ status: string; result?: unknown } | undefined)[] | undefined,
) {
  const allocationIndexes: number[] = []
  let flatIndex = 0

  const contracts = entries.flatMap((_entry, entryIndex) =>
    queueIdsByEntry[entryIndex].flatMap(() => {
      const marketParams = toMarketParams(getSuccessfulResult(marketParamsData?.[flatIndex]))
      const marketState = toMarketState(getSuccessfulResult(marketData?.[flatIndex]))
      const currentFlatIndex = flatIndex
      flatIndex++

      if (!marketParams || !marketState) {
        return []
      }

      allocationIndexes.push(currentFlatIndex)
      return [
        {
          address: marketParams.irm,
          abi: IRM_ABI,
          functionName: 'borrowRateView',
          args: [marketParams, marketState] as const,
          chainId: entries[entryIndex].chainId,
        } as const,
      ]
    }),
  )

  return { contracts, allocationIndexes }
}

function buildMarketSupplyApy(marketState: MarketStateShape | undefined, borrowRatePerSecond?: bigint): number {
  if (!marketState) {
    return 0
  }

  const borrowApy = ratePerSecondToApy(borrowRatePerSecond) ?? 0
  const totalSupplyAssets = Number(marketState.totalSupplyAssets)
  const totalBorrowAssets = Number(marketState.totalBorrowAssets)
  const utilization = totalSupplyAssets > 0 ? totalBorrowAssets / totalSupplyAssets : 0

  return clampToPositive(borrowApy * utilization * (1 - wadToFraction(marketState.fee)))
}

export function useMorphoMarketOnchainData(entityIds?: readonly string[]): Record<string, MorphoMarketOnchainData> {
  const entries = useMemo(() => filterRegistry(MORPHO_MARKET_BROWSE_REGISTRY, entityIds), [entityIds])

  const { data: marketParamsData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.morphoAddress,
              abi: MORPHO_ABI,
              functionName: 'idToMarketParams',
              args: [entry.marketId] as const,
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })

  const { data: marketStateData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.morphoAddress,
              abi: MORPHO_ABI,
              functionName: 'market',
              args: [entry.marketId] as const,
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })

  const paramsByIndex = useMemo(
    () => entries.map((_, index) => toMarketParams(getSuccessfulResult(marketParamsData?.[index]))),
    [entries, marketParamsData],
  )
  const statesByIndex = useMemo(
    () => entries.map((_, index) => toMarketState(getSuccessfulResult(marketStateData?.[index]))),
    [entries, marketStateData],
  )

  const irmPayload = useMemo(
    () => buildMarketIrmContracts(entries, paramsByIndex, statesByIndex),
    [entries, paramsByIndex, statesByIndex],
  )
  const oraclePayload = useMemo(() => buildOraclePriceContracts(entries, paramsByIndex), [entries, paramsByIndex])

  const { data: borrowRateData } = useReadContracts({
    contracts: irmPayload.contracts,
    query: { enabled: irmPayload.contracts.length > 0 },
  })
  const { data: oraclePriceData } = useReadContracts({
    contracts: oraclePayload.contracts,
    query: { enabled: oraclePayload.contracts.length > 0 },
  })

  const loanTokenInputs = useMemo(
    () => entries.map((entry, index) => ({ chainId: entry.chainId, address: paramsByIndex[index]?.loanToken })),
    [entries, paramsByIndex],
  )
  const collateralTokenInputs = useMemo(
    () => entries.map((entry, index) => ({ chainId: entry.chainId, address: paramsByIndex[index]?.collateralToken })),
    [entries, paramsByIndex],
  )
  const loanTokenPayload = useMemo(() => buildTokenMetadataContracts(loanTokenInputs), [loanTokenInputs])
  const collateralTokenPayload = useMemo(
    () => buildTokenMetadataContracts(collateralTokenInputs),
    [collateralTokenInputs],
  )

  const { data: loanTokenMetadataData } = useReadContracts({
    contracts: loanTokenPayload.contracts,
    query: { enabled: loanTokenPayload.contracts.length > 0 },
  })
  const { data: collateralTokenMetadataData } = useReadContracts({
    contracts: collateralTokenPayload.contracts,
    query: { enabled: collateralTokenPayload.contracts.length > 0 },
  })

  return useMemo(
    () =>
      entries.reduce<Record<string, MorphoMarketOnchainData>>((accumulator, entry, index) => {
        const marketParams = paramsByIndex[index]
        const marketState = statesByIndex[index]
        const loanAsset = readTokenMetadata(loanTokenInputs, loanTokenPayload, loanTokenMetadataData, index)
        const collateralAsset = readTokenMetadata(
          collateralTokenInputs,
          collateralTokenPayload,
          collateralTokenMetadataData,
          index,
        )

        if (!marketParams || !marketState || !loanAsset || !collateralAsset) {
          return accumulator
        }

        const irmIndex = irmPayload.entryIndexes.indexOf(index)
        const oracleIndex = oraclePayload.entryIndexes.indexOf(index)

        accumulator[entry.entityId] = {
          chainId: entry.chainId,
          marketId: entry.marketId,
          loanAsset,
          collateralAsset,
          marketParams,
          marketState,
          borrowRatePerSecond: irmIndex === -1 ? undefined : getSuccessfulResult(borrowRateData?.[irmIndex]),
          oraclePrice: oracleIndex === -1 ? undefined : getSuccessfulResult(oraclePriceData?.[oracleIndex]),
        }

        return accumulator
      }, {}),
    [
      borrowRateData,
      collateralTokenInputs,
      collateralTokenMetadataData,
      collateralTokenPayload,
      entries,
      irmPayload.entryIndexes,
      loanTokenInputs,
      loanTokenMetadataData,
      loanTokenPayload,
      oraclePayload.entryIndexes,
      oraclePriceData,
      paramsByIndex,
      statesByIndex,
    ],
  )
}

export function useMorphoVaultOnchainData(entityIds?: readonly string[]): Record<string, MorphoVaultOnchainData> {
  const entries = useMemo(() => filterRegistry(MORPHO_VAULT_BROWSE_REGISTRY, entityIds), [entityIds])

  const { data: nameData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'name',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })
  const { data: symbolData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'symbol',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })
  const { data: decimalsData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'decimals',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })
  const { data: assetData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'asset',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })
  const { data: totalAssetsData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'totalAssets',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })
  const { data: totalSupplyData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'totalSupply',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })
  const { data: curatorData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'curator',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })
  const { data: feeData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'fee',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })
  const assetInputs = useMemo(
    () =>
      entries.map((entry, index) => ({
        chainId: entry.chainId,
        address: toAddress(getSuccessfulResult(assetData?.[index])),
      })),
    [assetData, entries],
  )
  const assetPayload = useMemo(() => buildTokenMetadataContracts(assetInputs), [assetInputs])
  const { data: assetMetadataData } = useReadContracts({
    contracts: assetPayload.contracts,
    query: { enabled: assetPayload.contracts.length > 0 },
  })

  const shareUnits = useMemo(
    () =>
      entries.map(
        (_, index) => 10n ** BigInt((getSuccessfulResult(decimalsData?.[index]) as number | undefined) ?? 18),
      ),
    [decimalsData, entries],
  )
  const { data: sharePriceData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry, index) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'convertToAssets',
              args: [shareUnits[index]] as const,
              chainId: entry.chainId,
            }) as const,
        ),
      [entries, shareUnits],
    ),
    query: { enabled: entries.length > 0 },
  })

  const { data: queueLengthData } = useReadContracts({
    contracts: useMemo(
      () =>
        entries.map(
          (entry) =>
            ({
              address: entry.vaultAddress,
              abi: VAULT_ABI,
              functionName: 'supplyQueueLength',
              chainId: entry.chainId,
            }) as const,
        ),
      [entries],
    ),
    query: { enabled: entries.length > 0 },
  })

  const queuePayload = useMemo(() => buildVaultQueueContracts(entries, queueLengthData), [entries, queueLengthData])
  const { data: queueData } = useReadContracts({
    contracts: queuePayload.contracts,
    query: { enabled: queuePayload.contracts.length > 0 },
  })
  const queueIdsByEntry = useMemo(
    () => getQueueIdsByEntry(entries, queuePayload, queueData),
    [entries, queueData, queuePayload],
  )

  const allocationPayload = useMemo(
    () => buildVaultAllocationContracts(entries, queueIdsByEntry),
    [entries, queueIdsByEntry],
  )
  const { data: configData } = useReadContracts({
    contracts: allocationPayload.configContracts,
    query: { enabled: allocationPayload.configContracts.length > 0 },
  })
  const { data: positionData } = useReadContracts({
    contracts: allocationPayload.positionContracts,
    query: { enabled: allocationPayload.positionContracts.length > 0 },
  })
  const { data: marketData } = useReadContracts({
    contracts: allocationPayload.marketContracts,
    query: { enabled: allocationPayload.marketContracts.length > 0 },
  })
  const { data: marketParamsData } = useReadContracts({
    contracts: allocationPayload.marketParamsContracts,
    query: { enabled: allocationPayload.marketParamsContracts.length > 0 },
  })

  const nestedIrmPayload = useMemo(
    () => buildNestedMarketIrmContracts(entries, queueIdsByEntry, marketParamsData, marketData),
    [entries, marketData, marketParamsData, queueIdsByEntry],
  )
  const { data: nestedBorrowRateData } = useReadContracts({
    contracts: nestedIrmPayload.contracts,
    query: { enabled: nestedIrmPayload.contracts.length > 0 },
  })

  const allocationItems = useMemo(() => {
    const items: Array<{ chainId: number; loanToken?: Address; collateralToken?: Address }> = []

    let flatIndex = 0
    entries.forEach((entry, entryIndex) => {
      queueIdsByEntry[entryIndex].forEach(() => {
        const marketParams = toMarketParams(getSuccessfulResult(marketParamsData?.[flatIndex]))
        items.push({
          chainId: entry.chainId,
          loanToken: marketParams?.loanToken,
          collateralToken: marketParams?.collateralToken,
        })
        flatIndex++
      })
    })

    return items
  }, [entries, marketParamsData, queueIdsByEntry])

  const allocationLoanInputs = useMemo(
    () => allocationItems.map((item) => ({ chainId: item.chainId, address: item.loanToken })),
    [allocationItems],
  )
  const allocationCollateralInputs = useMemo(
    () => allocationItems.map((item) => ({ chainId: item.chainId, address: item.collateralToken })),
    [allocationItems],
  )
  const allocationLoanPayload = useMemo(() => buildTokenMetadataContracts(allocationLoanInputs), [allocationLoanInputs])
  const allocationCollateralPayload = useMemo(
    () => buildTokenMetadataContracts(allocationCollateralInputs),
    [allocationCollateralInputs],
  )
  const { data: allocationLoanMetadataData } = useReadContracts({
    contracts: allocationLoanPayload.contracts,
    query: { enabled: allocationLoanPayload.contracts.length > 0 },
  })
  const { data: allocationCollateralMetadataData } = useReadContracts({
    contracts: allocationCollateralPayload.contracts,
    query: { enabled: allocationCollateralPayload.contracts.length > 0 },
  })

  return useMemo(
    () =>
      entries.reduce<Record<string, MorphoVaultOnchainData>>((accumulator, entry, entryIndex) => {
        const asset = readTokenMetadata(assetInputs, assetPayload, assetMetadataData, entryIndex)
        const totalAssets = getSuccessfulResult(totalAssetsData?.[entryIndex]) as bigint | undefined
        const totalSupplyShares = getSuccessfulResult(totalSupplyData?.[entryIndex]) as bigint | undefined
        const decimals = (getSuccessfulResult(decimalsData?.[entryIndex]) as number | undefined) ?? 18

        if (!asset || typeof totalAssets !== 'bigint' || typeof totalSupplyShares !== 'bigint') {
          return accumulator
        }

        const queueIds = queueIdsByEntry[entryIndex] ?? []
        const startFlatIndex = queueIdsByEntry.slice(0, entryIndex).reduce((sum, ids) => sum + ids.length, 0)
        let capacityAssets = 0n
        let allocatedAssets = 0n

        const allocations = queueIds.map((marketId, queueIndex) => {
          const flatIndex = startFlatIndex + queueIndex
          const config = toVaultConfig(getSuccessfulResult(configData?.[flatIndex]))
          const position = getSuccessfulResult(positionData?.[flatIndex])
          const marketState = toMarketState(getSuccessfulResult(marketData?.[flatIndex]))
          const marketParams = toMarketParams(getSuccessfulResult(marketParamsData?.[flatIndex]))
          const supplyShares = readNamedValue<bigint>(position, 0, 'supplyShares') ?? 0n
          const suppliedAssets = scaleSupplySharesToAssets(supplyShares, marketState)
          const cap = config?.cap ?? 0n
          const nestedRateIndex = nestedIrmPayload.allocationIndexes.indexOf(flatIndex)
          const borrowRatePerSecond =
            nestedRateIndex === -1
              ? undefined
              : (getSuccessfulResult(nestedBorrowRateData?.[nestedRateIndex]) as bigint | undefined)
          const loanAsset = readTokenMetadata(
            allocationLoanInputs,
            allocationLoanPayload,
            allocationLoanMetadataData,
            flatIndex,
          )
          const collateralAsset = readTokenMetadata(
            allocationCollateralInputs,
            allocationCollateralPayload,
            allocationCollateralMetadataData,
            flatIndex,
          )

          capacityAssets += cap
          allocatedAssets += suppliedAssets

          return {
            marketId,
            suppliedAssets,
            cap,
            enabled: config?.enabled ?? false,
            market:
              marketParams && marketState && loanAsset && collateralAsset
                ? {
                    chainId: entry.chainId,
                    marketId,
                    loanAsset,
                    collateralAsset,
                    marketParams,
                    marketState,
                    borrowRatePerSecond,
                  }
                : undefined,
          } satisfies MorphoVaultAllocationOnchainData
        })

        const idleAssets = totalAssets > allocatedAssets ? totalAssets - allocatedAssets : 0n
        const grossApy =
          totalAssets > 0n
            ? allocations.reduce((sum, allocation) => {
                const allocationApy = buildMarketSupplyApy(
                  allocation.market?.marketState,
                  allocation.market?.borrowRatePerSecond,
                )
                return sum + allocationApy * (Number(allocation.suppliedAssets) / Number(totalAssets))
              }, 0)
            : 0

        accumulator[entry.entityId] = {
          chainId: entry.chainId,
          vaultAddress: entry.vaultAddress,
          title:
            (getSuccessfulResult(nameData?.[entryIndex]) as string | undefined) ?? shortAddress(entry.vaultAddress),
          symbol: getSuccessfulResult(symbolData?.[entryIndex]) as string | undefined,
          decimals,
          asset,
          totalAssets,
          totalSupplyShares,
          idleAssets,
          curator: toAddress(getSuccessfulResult(curatorData?.[entryIndex])),
          fee: getSuccessfulResult(feeData?.[entryIndex]) as bigint | undefined,
          sharePriceAssetsPerShare: getSuccessfulResult(sharePriceData?.[entryIndex]) as bigint | undefined,
          apy: clampToPositive(
            grossApy * (1 - wadToFraction(getSuccessfulResult(feeData?.[entryIndex]) as bigint | undefined)),
          ),
          allocations,
          capacityAssets,
        }

        return accumulator
      }, {}),
    [
      allocationCollateralInputs,
      allocationCollateralMetadataData,
      allocationCollateralPayload,
      allocationLoanInputs,
      allocationLoanMetadataData,
      allocationLoanPayload,
      assetInputs,
      assetMetadataData,
      assetPayload,
      configData,
      curatorData,
      decimalsData,
      entries,
      feeData,
      marketData,
      marketParamsData,
      nameData,
      nestedBorrowRateData,
      nestedIrmPayload.allocationIndexes,
      positionData,
      queueIdsByEntry,
      sharePriceData,
      symbolData,
      totalAssetsData,
      totalSupplyData,
    ],
  )
}

interface MorphoMarketPositionSummary {
  entityId: string
  supplyShares: bigint
  borrowShares: bigint
  collateral: bigint
  totalSupplyAssets: bigint
  totalSupplyShares: bigint
  totalBorrowAssets: bigint
  totalBorrowShares: bigint
}

interface MorphoVaultPositionSummary {
  entityId: string
  shares: bigint
  assets: bigint
}

export function useMorphoAllMarketPositions(): MorphoMarketPositionSummary[] {
  const account = useAccount()
  const userAddress = account.address ? assume0xAddress(account.address) : undefined
  const entries = MORPHO_MARKET_BROWSE_REGISTRY
  const enabled = Boolean(userAddress) && entries.length > 0

  const safeUser = userAddress ?? ZERO_ADDRESS

  const contracts = useMemo(
    () =>
      entries.flatMap((entry) => [
        {
          address: entry.morphoAddress,
          abi: MORPHO_ABI,
          functionName: 'position' as const,
          args: [entry.marketId, safeUser] as const,
          chainId: entry.chainId,
        },
        {
          address: entry.morphoAddress,
          abi: MORPHO_ABI,
          functionName: 'market' as const,
          args: [entry.marketId] as const,
          chainId: entry.chainId,
        },
      ]),
    [entries, safeUser],
  )

  const { data } = useReadContracts({
    contracts,
    query: { enabled, refetchInterval: 12_000 },
  })

  return useMemo(() => {
    if (!data) {
      return []
    }

    return entries
      .map((entry, index) => {
        const positionResult = getSuccessfulResult(data[index * 2])
        const marketStateResult = getSuccessfulResult(data[index * 2 + 1])
        if (!positionResult || !marketStateResult) {
          return null
        }

        const supplyShares = readNamedValue<bigint>(positionResult, 0, 'supplyShares') ?? 0n
        const borrowShares = readNamedValue<bigint>(positionResult, 1, 'borrowShares') ?? 0n
        const collateral = readNamedValue<bigint>(positionResult, 2, 'collateral') ?? 0n

        if (supplyShares === 0n && borrowShares === 0n && collateral === 0n) {
          return null
        }

        const state = toMarketState(marketStateResult)
        if (!state) {
          return null
        }

        return {
          entityId: entry.entityId,
          supplyShares,
          borrowShares,
          collateral,
          totalSupplyAssets: state.totalSupplyAssets,
          totalSupplyShares: state.totalSupplyShares,
          totalBorrowAssets: state.totalBorrowAssets,
          totalBorrowShares: state.totalBorrowShares,
        }
      })
      .filter((item): item is MorphoMarketPositionSummary => item !== null)
  }, [data, entries])
}

export function useMorphoAllVaultPositions(): MorphoVaultPositionSummary[] {
  const account = useAccount()
  const userAddress = account.address ? assume0xAddress(account.address) : undefined
  const entries = MORPHO_VAULT_BROWSE_REGISTRY
  const enabled = Boolean(userAddress) && entries.length > 0

  const safeUser = userAddress ?? ZERO_ADDRESS

  const contracts = useMemo(
    () =>
      entries.flatMap((entry) => [
        {
          address: entry.vaultAddress,
          abi: VAULT_ABI,
          functionName: 'balanceOf' as const,
          args: [safeUser] as const,
          chainId: entry.chainId,
        },
        {
          address: entry.vaultAddress,
          abi: VAULT_ABI,
          functionName: 'totalAssets' as const,
          args: [] as const,
          chainId: entry.chainId,
        },
        {
          address: entry.vaultAddress,
          abi: VAULT_ABI,
          functionName: 'totalSupply' as const,
          args: [] as const,
          chainId: entry.chainId,
        },
      ]),
    [entries, safeUser],
  )

  const { data } = useReadContracts({
    contracts,
    query: { enabled, refetchInterval: 12_000 },
  })

  return useMemo(() => {
    if (!data) {
      return []
    }

    return entries
      .map((entry, index) => {
        const shares = getSuccessfulResult(data[index * 3]) as bigint | undefined
        const totalAssets = getSuccessfulResult(data[index * 3 + 1]) as bigint | undefined
        const totalSupply = getSuccessfulResult(data[index * 3 + 2]) as bigint | undefined

        if (typeof shares !== 'bigint' || shares === 0n) {
          return null
        }

        const assets =
          typeof totalAssets === 'bigint' && typeof totalSupply === 'bigint' && totalSupply > 0n
            ? (shares * totalAssets) / totalSupply
            : 0n

        return { entityId: entry.entityId, shares, assets }
      })
      .filter((item): item is MorphoVaultPositionSummary => item !== null)
  }, [data, entries])
}

interface MorphoUserPositionData {
  supplyShares: bigint
  borrowShares: bigint
  collateral: bigint
  totalSupplyAssets: bigint
  totalSupplyShares: bigint
  totalBorrowAssets: bigint
  totalBorrowShares: bigint
}

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'

export function useMorphoUserPosition(
  morphoAddress: Address | undefined,
  marketId: Address | undefined,
  chainId: number | undefined,
): MorphoUserPositionData | undefined {
  const account = useAccount()
  const userAddress = account.address ? assume0xAddress(account.address) : undefined

  const enabled = Boolean(morphoAddress && marketId && chainId && userAddress)
  const safeAddress = morphoAddress ?? ZERO_ADDRESS
  const safeMarketId = marketId ?? ZERO_ADDRESS
  const safeUser = userAddress ?? ZERO_ADDRESS
  const safeChainId = chainId ?? 1

  const contracts = useMemo(
    () =>
      [
        {
          address: safeAddress,
          abi: MORPHO_ABI,
          functionName: 'position' as const,
          args: [safeMarketId, safeUser] as const,
          chainId: safeChainId,
        },
        {
          address: safeAddress,
          abi: MORPHO_ABI,
          functionName: 'market' as const,
          args: [safeMarketId] as const,
          chainId: safeChainId,
        },
      ] as const,
    [safeAddress, safeMarketId, safeUser, safeChainId],
  )

  const { data } = useReadContracts({
    contracts,
    query: { enabled, refetchInterval: 12_000 },
  })

  return useMemo(() => {
    if (!data || data.length < 2) {
      return undefined
    }

    const positionResult = getSuccessfulResult(data[0])
    const marketStateResult = getSuccessfulResult(data[1])

    if (!positionResult || !marketStateResult) {
      return undefined
    }

    const supplyShares = readNamedValue<bigint>(positionResult, 0, 'supplyShares')
    const borrowShares = readNamedValue<bigint>(positionResult, 1, 'borrowShares')
    const collateral = readNamedValue<bigint>(positionResult, 2, 'collateral')
    const state = toMarketState(marketStateResult)

    if (
      typeof supplyShares !== 'bigint' ||
      typeof borrowShares !== 'bigint' ||
      typeof collateral !== 'bigint' ||
      !state
    ) {
      return undefined
    }

    return {
      supplyShares,
      borrowShares,
      collateral,
      totalSupplyAssets: state.totalSupplyAssets,
      totalSupplyShares: state.totalSupplyShares,
      totalBorrowAssets: state.totalBorrowAssets,
      totalBorrowShares: state.totalBorrowShares,
    }
  }, [data])
}

interface MorphoVaultUserPositionData {
  shares: bigint
  assets: bigint
  maxWithdrawAssets: bigint
  maxRedeemShares: bigint
}

export function useMorphoVaultUserPosition(
  vaultAddress: Address | undefined,
  chainId: number | undefined,
): MorphoVaultUserPositionData | undefined {
  const account = useAccount()
  const userAddress = account.address ? assume0xAddress(account.address) : undefined

  const enabled = Boolean(vaultAddress && chainId && userAddress)
  const safeVault = vaultAddress ?? ZERO_ADDRESS
  const safeUser = userAddress ?? ZERO_ADDRESS
  const safeChainId = chainId ?? 1

  const contracts = useMemo(
    () =>
      [
        {
          address: safeVault,
          abi: VAULT_ABI,
          functionName: 'balanceOf' as const,
          args: [safeUser] as const,
          chainId: safeChainId,
        },
        {
          address: safeVault,
          abi: VAULT_ABI,
          functionName: 'totalAssets' as const,
          args: [] as const,
          chainId: safeChainId,
        },
        {
          address: safeVault,
          abi: VAULT_ABI,
          functionName: 'totalSupply' as const,
          args: [] as const,
          chainId: safeChainId,
        },
        {
          address: safeVault,
          abi: VAULT_ABI,
          functionName: 'maxWithdraw' as const,
          args: [safeUser] as const,
          chainId: safeChainId,
        },
        {
          address: safeVault,
          abi: VAULT_ABI,
          functionName: 'maxRedeem' as const,
          args: [safeUser] as const,
          chainId: safeChainId,
        },
      ] as const,
    [safeVault, safeUser, safeChainId],
  )

  const { data } = useReadContracts({
    contracts,
    query: { enabled, refetchInterval: 12_000 },
  })

  return useMemo(() => {
    if (!data || data.length < 5) {
      return undefined
    }

    const shares = getSuccessfulResult(data[0]) as bigint | undefined
    const totalAssets = getSuccessfulResult(data[1]) as bigint | undefined
    const totalSupply = getSuccessfulResult(data[2]) as bigint | undefined
    const maxWithdrawAssets = getSuccessfulResult(data[3]) as bigint | undefined
    const maxRedeemShares = getSuccessfulResult(data[4]) as bigint | undefined

    if (typeof shares !== 'bigint' || typeof totalAssets !== 'bigint' || typeof totalSupply !== 'bigint') {
      return undefined
    }

    if (shares === 0n) {
      return { shares: 0n, assets: 0n, maxWithdrawAssets: 0n, maxRedeemShares: 0n }
    }

    const assets = totalSupply > 0n ? (shares * totalAssets) / totalSupply : 0n

    return {
      shares,
      assets,
      maxWithdrawAssets: typeof maxWithdrawAssets === 'bigint' ? maxWithdrawAssets : assets,
      maxRedeemShares: typeof maxRedeemShares === 'bigint' ? maxRedeemShares : shares,
    }
  }, [data])
}
