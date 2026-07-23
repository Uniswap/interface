import { type PlainMessage } from '@bufbuild/protobuf'
import type { Token as DataApiToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { GraphQLApi } from '@universe/api'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { EARN_EXPLORE_VAULT_CURRENCY_IDS } from 'uniswap/src/features/earn/launchAssets'
import type { EarnPositionInfo, EarnVaultCurator, EarnVaultInfo } from 'uniswap/src/features/earn/types'
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

const MORPHO_HOME_URL = 'https://morpho.org/'
export const MORPHO_FAQ_URL = 'https://morpho.org/faq/'
const MORPHO_APP_CHAIN_SLUG_BY_CHAIN_ID: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.Mainnet]: 'ethereum',
}

export function getEarnVaultId({ chainId, vaultAddress }: { chainId: number; vaultAddress: string }): string {
  return `${chainId}-${normalizeTokenAddressForCache(vaultAddress)}`
}

export function getMorphoVaultUrl({
  chainId,
  vaultAddress,
}: {
  chainId: UniverseChainId
  vaultAddress: string
}): string | undefined {
  const chainSlug = MORPHO_APP_CHAIN_SLUG_BY_CHAIN_ID[chainId]

  return chainSlug ? `https://app.morpho.org/${chainSlug}/vault/${vaultAddress}` : undefined
}

function getCurrencyIdForToken({
  chainId,
  token,
}: {
  chainId: UniverseChainId
  token: PlainMessage<DataApiToken>
}): string | undefined {
  if (!token.address) {
    return undefined
  }
  return isNativeCurrencyAddress(chainId, token.address)
    ? buildNativeCurrencyId(chainId)
    : buildCurrencyId(chainId, token.address)
}

export function getEarnVaultCurrencyId(vault: PlainMessage<DataApiEarnVault>): string | undefined {
  const chainId = toSupportedChainId(vault.chainId)
  if (!chainId || !vault.underlyingToken) {
    return undefined
  }
  return getCurrencyIdForToken({ chainId, token: vault.underlyingToken })
}

export function isWrappedNativeCurrencyId(currencyId: string): boolean {
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

function getEarnVaultCurator(dataApiVault: PlainMessage<DataApiEarnVault>): EarnVaultCurator {
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
  exposureTokens: readonly PlainMessage<DataApiToken>[]
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

export function getEarnVaultInfo(dataApiVault: PlainMessage<DataApiEarnVault>): EarnVaultInfo | undefined {
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
    liquidityRaw: dataApiVault.liquidityRaw || undefined,
    liquidityUsd: dataApiVault.liquidityUsd ?? 0,
    curator: getEarnVaultCurator(dataApiVault),
    deploymentDate: getEarnVaultDeploymentDate(dataApiVault.deploymentTimestamp),
    morphoUrl: MORPHO_HOME_URL,
    exposureAndRiskUrl: getMorphoVaultUrl({ chainId, vaultAddress }),
  }
}

export function getEarnVaultInfos(vaults: readonly PlainMessage<DataApiEarnVault>[] | undefined): EarnVaultInfo[] {
  const vaultInfos: EarnVaultInfo[] = []

  vaults?.forEach((vault) => {
    const vaultInfo = getEarnVaultInfo(vault)
    if (vaultInfo) {
      vaultInfos.push(vaultInfo)
    }
  })

  return vaultInfos
}

export function getEarnPositionInfo(
  position: PlainMessage<DataApiEarnPosition> | undefined,
): EarnPositionInfo | undefined {
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
  positions: readonly PlainMessage<DataApiEarnPosition>[] | undefined,
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

export function addCurrencyId(currencyIds: string[], currencyId: string | undefined): void {
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

function getEarnExploreVaultRank(vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'>): number {
  const vaultCurrencyIds = getEarnVaultTokenDetailsCurrencyIds(vault)
  const rank = EARN_EXPLORE_VAULT_CURRENCY_IDS.findIndex((currencyId) =>
    vaultCurrencyIds.some((vaultCurrencyId) => areCurrencyIdsEqual(currencyId, vaultCurrencyId)),
  )
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
}

export function getEarnVaultsSortedForExplore(vaults: readonly EarnVaultInfo[]): EarnVaultInfo[] {
  return [...vaults].sort((vaultA, vaultB) => getEarnExploreVaultRank(vaultA) - getEarnExploreVaultRank(vaultB))
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

export function hasConfirmedEarnPositionRawBalance(
  position: Pick<EarnPositionInfo, 'depositedRaw' | 'sharesRaw'> | undefined,
): boolean {
  if (!position) {
    return false
  }

  return isPositiveRawAmount(position.depositedRaw) || isPositiveRawAmount(position.sharesRaw)
}

export function hasConfirmedEarnPositionShareBalance(
  position: Pick<EarnPositionInfo, 'sharesRaw'> | undefined,
): boolean {
  if (!position) {
    return false
  }

  return isPositiveRawAmount(position.sharesRaw)
}

/**
 * Resolves which position the withdraw views should consume.
 *
 * `startWithdraw` snapshots the position into flow state one-shot. After a user's *first* deposit,
 * that snapshot is an optimistic entry with zero raw balances (`depositedRaw`/`sharesRaw` of '0'),
 * and nothing refreshes the snapshot while the withdraw view is open — review would stay gated on
 * 'Loading' forever even after the live GetEarnPosition query resolves. Prefer the live queried
 * position once its raw balances are confirmed for the same vault; otherwise keep the snapshot so
 * the view never loses the position identity it entered with.
 */
export function resolveEarnWithdrawPosition({
  livePosition,
  snapshotPosition,
}: {
  livePosition: EarnPositionInfo | undefined
  snapshotPosition: EarnPositionInfo
}): EarnPositionInfo {
  const isLivePositionConfirmedForVault =
    livePosition !== undefined &&
    livePosition.vaultId === snapshotPosition.vaultId &&
    hasConfirmedEarnPositionRawBalance(livePosition)

  return isLivePositionConfirmedForVault ? livePosition : snapshotPosition
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
