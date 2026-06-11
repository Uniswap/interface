import type { Token as DataApiToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { GraphQLApi } from '@universe/api'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { EARN_DEPOSIT_SOURCE_SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/earn/constants'
import type {
  EarnDepositSourceOption,
  EarnDepositSourceOptionsBySupport,
  EarnPositionInfo,
  EarnVaultCurator,
  EarnVaultInfo,
} from 'uniswap/src/features/earn/types'
import {
  areCurrencyIdsEqual,
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToChain,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'

function decimalRateToPercent(rate: number | undefined): number {
  return rate === undefined ? 0 : rate * 100
}

export function getEarnVaultId({ chainId, vaultAddress }: { chainId: number; vaultAddress: string }): string {
  return `${chainId}-${normalizeTokenAddressForCache(vaultAddress)}`
}

function getCurrencyIdForToken({
  chainId,
  token,
}: {
  chainId: UniverseChainId
  token: DataApiToken
}): string | undefined {
  if (!token.address) {
    return undefined
  }
  return isNativeCurrencyAddress(chainId, token.address)
    ? buildNativeCurrencyId(chainId)
    : buildCurrencyId(chainId, token.address)
}

export function getEarnVaultCurrencyId(vault: DataApiEarnVault): string | undefined {
  const chainId = toSupportedChainId(vault.chainId)
  if (!chainId || !vault.underlyingToken) {
    return undefined
  }
  return getCurrencyIdForToken({ chainId, token: vault.underlyingToken })
}

function isWrappedNativeCurrencyId(currencyId: string): boolean {
  const chainId = currencyIdToChain(currencyId)
  const wrappedNativeCurrencyId = chainId ? buildWrappedNativeCurrencyId(chainId) : undefined

  return !!wrappedNativeCurrencyId && areCurrencyIdsEqual(currencyId, wrappedNativeCurrencyId)
}

export function getEarnVaultDisplayCurrencyId(currencyId: string): string {
  const chainId = currencyIdToChain(currencyId)
  return chainId && isWrappedNativeCurrencyId(currencyId) ? buildNativeCurrencyId(chainId) : currencyId
}

export function isWrappedNativeEarnVault(vault: Pick<EarnVaultInfo, 'currencyId'>): boolean {
  return isWrappedNativeCurrencyId(vault.currencyId)
}

function getEarnVaultCurator(dataApiVault: DataApiEarnVault): EarnVaultCurator {
  return {
    name: dataApiVault.curatorName,
    imageUrl: dataApiVault.curatorImageUrl,
  }
}

// deployment_timestamp is Unix seconds (int64 → bigint); 0/missing means unknown.
function getEarnVaultDeploymentDate(timestampSeconds: bigint | undefined): Date | undefined {
  if (timestampSeconds === undefined) {
    return undefined
  }
  const seconds = Number(timestampSeconds)
  if (seconds === 0) {
    return undefined
  }
  return new Date(seconds * 1000)
}

function getExposureCurrencyIds({
  chainId,
  exposureTokens,
  fallbackCurrencyId,
}: {
  chainId: UniverseChainId
  exposureTokens: readonly DataApiToken[]
  fallbackCurrencyId: string
}): readonly string[] {
  if (exposureTokens.length === 0) {
    return [fallbackCurrencyId]
  }
  const currencyIds: string[] = []
  for (const token of exposureTokens) {
    const currencyId = getCurrencyIdForToken({ chainId, token })
    if (currencyId) {
      currencyIds.push(getEarnVaultDisplayCurrencyId(currencyId))
    }
  }
  return currencyIds.length > 0 ? currencyIds : [fallbackCurrencyId]
}

export function getEarnVaultInfo(dataApiVault: DataApiEarnVault): EarnVaultInfo | undefined {
  const chainId = toSupportedChainId(dataApiVault.chainId)
  const currencyId = getEarnVaultCurrencyId(dataApiVault)

  if (!chainId || !currencyId || !dataApiVault.address) {
    return undefined
  }

  const vaultAddress = dataApiVault.address
  const apyPercent = decimalRateToPercent(dataApiVault.netApy ?? dataApiVault.apy)

  return {
    // Frontend-derived fields.
    id: getEarnVaultId({ chainId, vaultAddress }),
    currencyId,
    displayCurrencyId: getEarnVaultDisplayCurrencyId(currencyId),
    exposureCurrencyIds: getExposureCurrencyIds({
      chainId,
      // Protobuf type marks this as non-nullable, but it can be undefined at runtime — keep the fallback.
      // oxlint-disable-next-line typescript-eslint/no-unnecessary-condition
      exposureTokens: dataApiVault.exposureTokens ?? [],
      fallbackCurrencyId: getEarnVaultDisplayCurrencyId(currencyId),
    }),

    // Backend fields normalized for app display.
    vaultAddress,
    chainId,
    apyPercent,
    totalDepositsUsd: dataApiVault.totalAssetsUsd ?? 0,
    liquidityUsd: dataApiVault.liquidityUsd ?? 0,
    curator: getEarnVaultCurator(dataApiVault),
    deploymentDate: getEarnVaultDeploymentDate(dataApiVault.deploymentTimestamp),
  }
}

export function getEarnVaultInfos(vaults: readonly DataApiEarnVault[] | undefined): EarnVaultInfo[] {
  const vaultInfos: EarnVaultInfo[] = []

  vaults?.forEach((vault) => {
    const vaultInfo = getEarnVaultInfo(vault)
    if (vaultInfo) {
      vaultInfos.push(vaultInfo)
    }
  })

  return vaultInfos
}

export function getEarnPositionInfo(position: DataApiEarnPosition | undefined): EarnPositionInfo | undefined {
  if (!position?.vault) {
    return undefined
  }

  const vaultInfo = getEarnVaultInfo(position.vault)

  if (!vaultInfo) {
    return undefined
  }

  return {
    vaultId: vaultInfo.id,
    depositedUsd: position.currentAssetsUsd ?? 0,
    depositedRaw: position.currentAssetsRaw || '0',
    apyPercent: vaultInfo.apyPercent,
    sharesRaw: position.sharesRaw || '0',
    lifetimePnlUsd: position.lifetimePnlUsd,
  }
}

export function getEarnPositionInfosByVaultId(
  positions: readonly DataApiEarnPosition[] | undefined,
): Map<string, EarnPositionInfo> {
  const positionsByVaultId = new Map<string, EarnPositionInfo>()

  positions?.forEach((position) => {
    const positionInfo = getEarnPositionInfo(position)
    if (positionInfo) {
      positionsByVaultId.set(positionInfo.vaultId, positionInfo)
    }
  })

  return positionsByVaultId
}

export type TokenProjectTokenForEarn = {
  chain?: GraphQLApi.Chain | string | null
  address?: string | null
}

export function getTokenProjectCurrencyIds(tokens: readonly TokenProjectTokenForEarn[] | undefined): string[] {
  const currencyIds: string[] = []

  tokens?.forEach((token) => {
    const chainId = fromGraphQLChain(token.chain ?? undefined)
    if (!chainId) {
      return
    }

    if (!token.address) {
      return
    }

    const currencyId = isNativeCurrencyAddress(chainId, token.address)
      ? buildNativeCurrencyId(chainId)
      : buildCurrencyId(chainId, token.address)

    currencyIds.push(currencyId)
  })

  return currencyIds
}

export function selectEarnVaultForToken({
  tokenCurrencyIds,
  vaults,
}: {
  tokenCurrencyIds: readonly string[]
  vaults: readonly EarnVaultInfo[]
}): EarnVaultInfo | undefined {
  let selectedVault: EarnVaultInfo | undefined

  vaults.forEach((vault) => {
    const vaultTokenDetailsCurrencyIds = getEarnVaultTokenDetailsCurrencyIds(vault)
    const isTokenVault = tokenCurrencyIds.some((currencyId) =>
      vaultTokenDetailsCurrencyIds.some((vaultCurrencyId) => areCurrencyIdsEqual(currencyId, vaultCurrencyId)),
    )
    if (isTokenVault && (!selectedVault || vault.apyPercent > selectedVault.apyPercent)) {
      selectedVault = vault
    }
  })

  return selectedVault
}

function addCurrencyId(currencyIds: string[], currencyId: string | undefined): void {
  if (!currencyId) {
    return
  }

  if (currencyIds.some((existingCurrencyId) => areCurrencyIdsEqual(existingCurrencyId, currencyId))) {
    return
  }

  currencyIds.push(currencyId)
}

export function getEarnVaultTokenDetailsCurrencyIds(
  vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'>,
): string[] {
  const currencyIds: string[] = []
  addCurrencyId(currencyIds, vault.currencyId)
  addCurrencyId(currencyIds, vault.displayCurrencyId)
  return currencyIds
}

export function getEarnVaultDepositSourceCurrencyIds({
  tokenProjectCurrencyIds,
  vault,
}: {
  tokenProjectCurrencyIds: readonly string[] | undefined
  vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'>
}): string[] {
  const currencyIds: string[] = []
  const shouldAddNativeSources = isWrappedNativeEarnVault(vault)
  const candidateCurrencyIds = [vault.currencyId, ...(tokenProjectCurrencyIds ?? [])]

  candidateCurrencyIds.forEach((currencyId) => {
    addCurrencyId(currencyIds, currencyId)

    if (!shouldAddNativeSources || !isWrappedNativeCurrencyId(currencyId)) {
      return
    }

    const chainId = currencyIdToChain(currencyId)
    if (chainId) {
      addCurrencyId(currencyIds, buildNativeCurrencyId(chainId))
    }
  })

  addCurrencyId(currencyIds, vault.displayCurrencyId)
  return currencyIds
}

export function getEarnVaultWithdrawDestinationCurrencyId({
  destinationChainId,
  vault,
}: {
  destinationChainId: UniverseChainId
  vault: Pick<EarnVaultInfo, 'currencyId'>
}): string {
  return isWrappedNativeEarnVault(vault) ? buildNativeCurrencyId(destinationChainId) : vault.currencyId
}

export function getEarnDepositSourceOptions({
  portfolioBalances,
  tokenProjectCurrencyIds,
  vault,
}: {
  portfolioBalances: Record<string, PortfolioBalance> | undefined
  tokenProjectCurrencyIds: readonly string[] | undefined
  vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'>
}): EarnDepositSourceOption[] {
  if (!portfolioBalances) {
    return []
  }

  const sourceCurrencyIds = getEarnVaultDepositSourceCurrencyIds({
    tokenProjectCurrencyIds,
    vault,
  })
  const options: EarnDepositSourceOption[] = []

  Object.values(portfolioBalances).forEach((balance) => {
    const isDepositSource = sourceCurrencyIds.some((currencyId) =>
      areCurrencyIdsEqual(currencyId, balance.currencyInfo.currencyId),
    )
    if (!isDepositSource || balance.quantity <= 0) {
      return
    }

    options.push({
      id: balance.currencyInfo.currencyId,
      chainId: balance.currencyInfo.currency.chainId,
      currencyInfo: balance.currencyInfo,
      balanceQuantity: balance.quantity,
      balanceUsd: balance.balanceUSD ?? undefined,
    })
  })

  return options.sort(compareEarnDepositSourceBalanceDesc)
}

export function getEarnDepositSourceOptionsBySupport(
  depositSourceOptions: readonly EarnDepositSourceOption[],
): EarnDepositSourceOptionsBySupport {
  const supportedDepositSourceOptions: EarnDepositSourceOption[] = []
  const unsupportedDepositSourceOptions: EarnDepositSourceOption[] = []

  depositSourceOptions.forEach((option) => {
    const destination = EARN_DEPOSIT_SOURCE_SUPPORTED_CHAIN_IDS.includes(option.chainId)
      ? supportedDepositSourceOptions
      : unsupportedDepositSourceOptions

    destination.push(option)
  })

  return {
    supportedDepositSourceOptions,
    unsupportedDepositSourceOptions,
  }
}

function compareEarnDepositSourceBalanceDesc(
  optionA: EarnDepositSourceOption,
  optionB: EarnDepositSourceOption,
): number {
  // Priced rows (balanceUsd > 0) always rank above unpriced rows so that a small priced balance
  // doesn't fall below a large unpriced one — USD and token-quantity units aren't comparable.
  const aIsPriced = isPricedDepositSource(optionA)
  const bIsPriced = isPricedDepositSource(optionB)
  if (aIsPriced !== bIsPriced) {
    return aIsPriced ? -1 : 1
  }

  const balanceDiff = aIsPriced
    ? (optionB.balanceUsd ?? 0) - (optionA.balanceUsd ?? 0)
    : optionB.balanceQuantity - optionA.balanceQuantity
  if (balanceDiff !== 0) {
    return balanceDiff
  }

  if (optionA.currencyInfo.currency.isNative !== optionB.currencyInfo.currency.isNative) {
    return optionA.currencyInfo.currency.isNative ? -1 : 1
  }

  if (optionA.chainId !== optionB.chainId) {
    return optionA.chainId - optionB.chainId
  }

  // Unreachable in practice: ids are `${chainId}-${address}`, so equal chainIds + same nativeness + same balance
  // means the same currency. Kept for sort stability and to satisfy the comparator contract.
  return optionA.id.localeCompare(optionB.id)
}

function isPricedDepositSource(option: EarnDepositSourceOption): boolean {
  return option.balanceUsd !== undefined && option.balanceUsd > 0
}

export function getTokenBalanceUsd({
  balance,
  tokenPriceUsd,
}: {
  balance: PortfolioBalance | undefined
  tokenPriceUsd: number | undefined
}): number | undefined {
  if (!balance || balance.quantity <= 0) {
    return undefined
  }

  if (typeof balance.balanceUSD === 'number' && balance.balanceUSD > 0) {
    return balance.balanceUSD
  }

  return tokenPriceUsd ? balance.quantity * tokenPriceUsd : undefined
}

export function getTotalEarnDepositedUsd(positions: Iterable<EarnPositionInfo>): number {
  let totalDepositedUsd = 0

  for (const position of positions) {
    if (hasEarnPosition(position)) {
      totalDepositedUsd += position.depositedUsd
    }
  }

  return totalDepositedUsd
}

export function getEarnVaultsSortedByPosition({
  positionsByVaultId,
  vaults,
}: {
  positionsByVaultId: ReadonlyMap<string, EarnPositionInfo>
  vaults: readonly EarnVaultInfo[]
}): EarnVaultInfo[] {
  return [...vaults].sort((vaultA, vaultB) => {
    const positionA = positionsByVaultId.get(vaultA.id)
    const positionB = positionsByVaultId.get(vaultB.id)
    const hasPositionA = hasEarnPosition(positionA)
    const hasPositionB = hasEarnPosition(positionB)

    if (hasPositionA !== hasPositionB) {
      return hasPositionA ? -1 : 1
    }

    if (positionA && positionB) {
      return positionB.depositedUsd - positionA.depositedUsd
    }

    return 0
  })
}

export function hasEarnPosition(position: EarnPositionInfo | undefined): boolean {
  if (!position) {
    return false
  }

  if (position.depositedUsd > 0) {
    return true
  }

  return isPositiveRawAmount(position.depositedRaw) || isPositiveRawAmount(position.sharesRaw)
}

function isPositiveRawAmount(rawAmount: string): boolean {
  const rawAmountTrimmed = rawAmount.trim()
  if (!rawAmountTrimmed) {
    return false
  }

  try {
    return BigInt(rawAmountTrimmed) > BigInt(0)
  } catch {
    return Number(rawAmountTrimmed) > 0
  }
}
