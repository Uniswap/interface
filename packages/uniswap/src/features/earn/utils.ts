import type {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { GraphQLApi } from '@universe/api'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { fromGraphQLChain, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import type { EarnPositionInfo, EarnVaultCurator, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  areCurrencyIdsEqual,
  buildCurrencyId,
  buildNativeCurrencyId,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'

// TODO(CONS-1781): Confirm whether the data-api will provide curator metadata
// and vault resource links. If not, move intentional frontend constants here.
const GAUNTLET_CURATOR: EarnVaultCurator = {
  name: 'Gauntlet',
}

function decimalRateToPercent(rate: number | undefined): number {
  return rate === undefined ? 0 : rate * 100
}

export function getEarnVaultId({ chainId, vaultAddress }: { chainId: number; vaultAddress: string }): string {
  return `${chainId}-${normalizeTokenAddressForCache(vaultAddress)}`
}

export function getEarnVaultCurrencyId(vault: DataApiEarnVault): string | undefined {
  const chainId = toSupportedChainId(vault.chainId)
  const address = vault.underlyingToken?.address

  if (!chainId || !address) {
    return undefined
  }

  return isNativeCurrencyAddress(chainId, address) ? buildNativeCurrencyId(chainId) : buildCurrencyId(chainId, address)
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
    exposureCurrencyIds: [currencyId],

    // Backend fields normalized for app display.
    vaultAddress,
    chainId,
    apyPercent,
    totalDepositsUsd: dataApiVault.totalAssetsUsd ?? 0,
    liquidityUsd: dataApiVault.liquidityUsd ?? 0,

    // Frontend metadata until the data-api owns curator/link fields.
    curator: GAUNTLET_CURATOR,
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
    const isTokenVault = tokenCurrencyIds.some((currencyId) => areCurrencyIdsEqual(currencyId, vault.currencyId))
    if (isTokenVault && (!selectedVault || vault.apyPercent > selectedVault.apyPercent)) {
      selectedVault = vault
    }
  })

  return selectedVault
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

export function getProjectedAnnualEarningsUsd({
  balanceUsd,
  apyPercent,
}: {
  balanceUsd: number
  apyPercent: number
}): number {
  return balanceUsd * (apyPercent / 100)
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
