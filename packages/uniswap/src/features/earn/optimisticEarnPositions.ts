import type { QueryClient } from '@tanstack/react-query'
import { TradingApi } from '@universe/api'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnAction, type EarnPositionInfo, type EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnVaultId } from 'uniswap/src/features/earn/utils'
import { uuid } from 'utilities/src/primitives/uuid'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { create } from 'zustand'

// Earn indexing can take more than two minutes after an onchain success. Keep the confirmed
// transaction's optimistic position visible while bounded repolls reconcile with the API.
const OPTIMISTIC_EARN_POSITION_TTL_MS = 5 * ONE_MINUTE_MS
const EARN_POSITION_QUERY_REPOLL_DELAYS_MS = [
  0,
  2_000,
  6_000,
  15_000,
  30_000,
  ONE_MINUTE_MS,
  2 * ONE_MINUTE_MS,
  4 * ONE_MINUTE_MS,
] as const
const EARN_POSITION_USD_EPSILON = 0.01

type EarnVaultPositionMetadata = Pick<EarnVaultInfo, 'chainId' | 'vaultAddress'> &
  Partial<Pick<EarnVaultInfo, 'apyPercent' | 'id'>>

export type OptimisticEarnPositionUpdate = {
  id: string
  action: EarnAction
  createdAtMs: number
  depositedUsd: number
  /**
   * The API-reported `sharesRaw` before this chain of optimistic actions began. Shares only move
   * when a transaction is indexed, so this is the catch-up signal — `depositedUsd` drifts with
   * prices/slippage/fees and can never reach the synthetic target. Inherited from the prior
   * active update when one exists, because the caller's position may already be optimistically
   * overlaid (a withdraw overlay zeroes `sharesRaw`).
   */
  baselineSharesRaw: string
  walletAddress: string
  vaultAddress: string
  vaultChainId: UniverseChainId
  vaultId: string
  vaultApyPercent?: number
}

type OptimisticEarnPositionStore = {
  updatesById: Record<string, OptimisticEarnPositionUpdate>
  addUpdate: (update: OptimisticEarnPositionUpdate) => void
  removeUpdate: (id: string) => void
  clearUpdates: () => void
}

export const useOptimisticEarnPositionStore = create<OptimisticEarnPositionStore>()((set) => ({
  updatesById: {},
  addUpdate: (update): void =>
    set((state) => ({
      updatesById: {
        ...state.updatesById,
        [update.id]: update,
      },
    })),
  removeUpdate: (id): void =>
    set((state) => {
      const updatesById = { ...state.updatesById }
      delete updatesById[id]
      return { updatesById }
    }),
  clearUpdates: (): void => set({ updatesById: {} }),
}))

function addOptimisticEarnPositionUpdate({
  action,
  baselineSharesRaw,
  depositedUsd,
  queryClient,
  ttlMs = OPTIMISTIC_EARN_POSITION_TTL_MS,
  vault,
  walletAddress,
}: {
  action: EarnAction
  baselineSharesRaw: string
  depositedUsd: number
  queryClient: QueryClient
  ttlMs?: number
  vault: EarnVaultPositionMetadata
  walletAddress: string
}): string {
  const id = getNextOptimisticUpdateId()
  const update: OptimisticEarnPositionUpdate = {
    id,
    action,
    createdAtMs: Date.now(),
    depositedUsd: Math.max(depositedUsd, 0),
    baselineSharesRaw,
    walletAddress: normalizeTokenAddressForCache(walletAddress),
    vaultAddress: normalizeTokenAddressForCache(vault.vaultAddress),
    vaultChainId: vault.chainId,
    vaultId: getVaultPositionId(vault),
    vaultApyPercent: vault.apyPercent,
  }

  useOptimisticEarnPositionStore.getState().addUpdate(update)

  if (ttlMs > 0) {
    setTimeout(() => {
      useOptimisticEarnPositionStore.getState().removeUpdate(id)
      invalidateEarnPostTransactionQueries(queryClient)
    }, ttlMs)
  }

  return id
}

export function applyEarnPositionChangeOptimistically({
  action,
  amount,
  currentPosition,
  localFiatToUsd,
  queryClient,
  vault,
  walletAddress,
  withdrawMode,
}: {
  action: EarnAction
  amount: string
  currentPosition: EarnPositionInfo | undefined
  localFiatToUsd: (amount: number) => number | undefined
  queryClient: QueryClient
  vault: EarnVaultPositionMetadata | undefined
  walletAddress: string | undefined
  withdrawMode?: TradingApi.EarnWithdrawMode
}): void {
  scheduleEarnPositionQueryRepolls(queryClient)

  if (!vault || !walletAddress) {
    return
  }

  const parsedAmountLocalFiat = Number(amount)
  const amountUsd = Number.isFinite(parsedAmountLocalFiat)
    ? (localFiatToUsd(parsedAmountLocalFiat) ?? parsedAmountLocalFiat)
    : 0
  const currentDepositedUsd = currentPosition?.depositedUsd ?? 0
  const nextDepositedUsd =
    action === EarnAction.Deposit
      ? currentDepositedUsd + amountUsd
      : withdrawMode === TradingApi.EarnWithdrawMode.MAX_SHARES
        ? 0
        : Math.max(currentDepositedUsd - amountUsd, 0)

  // `currentPosition` may already be optimistically overlaid (e.g. a masking withdraw zeroes
  // `sharesRaw`), so an active update's baseline — captured when the API position was last
  // authoritative — is preferred over the caller's position.
  const activeUpdate = getLatestMatchingUpdate({
    updatesById: useOptimisticEarnPositionStore.getState().updatesById,
    vault,
    walletAddress,
  })

  addOptimisticEarnPositionUpdate({
    action,
    baselineSharesRaw: activeUpdate?.baselineSharesRaw ?? currentPosition?.sharesRaw ?? '0',
    depositedUsd: nextDepositedUsd,
    queryClient,
    vault,
    walletAddress,
  })
}

export function applyOptimisticEarnPositionUpdates({
  chainIds,
  positionsByVaultId,
  updatesById,
  vaults,
  walletAddress,
}: {
  chainIds?: readonly UniverseChainId[]
  positionsByVaultId: ReadonlyMap<string, EarnPositionInfo>
  updatesById: Readonly<Record<string, OptimisticEarnPositionUpdate>>
  vaults: readonly EarnVaultInfo[]
  walletAddress: string | undefined
}): ReadonlyMap<string, EarnPositionInfo> {
  if (!walletAddress || Object.keys(updatesById).length === 0) {
    return positionsByVaultId
  }

  let nextPositionsByVaultId: Map<string, EarnPositionInfo> | undefined

  for (const vault of vaults) {
    const currentPosition = positionsByVaultId.get(vault.id)
    const optimisticPosition = applyOptimisticEarnPositionUpdate({
      chainIds,
      position: currentPosition,
      updatesById,
      vault,
      walletAddress,
    })

    if (optimisticPosition !== currentPosition) {
      nextPositionsByVaultId ??= new Map(positionsByVaultId)

      if (optimisticPosition) {
        nextPositionsByVaultId.set(vault.id, optimisticPosition)
      } else {
        nextPositionsByVaultId.delete(vault.id)
      }
    }
  }

  return nextPositionsByVaultId ?? positionsByVaultId
}

export function applyOptimisticEarnPositionUpdate({
  chainIds,
  position,
  updatesById,
  vault,
  walletAddress,
}: {
  chainIds?: readonly UniverseChainId[]
  position: EarnPositionInfo | undefined
  updatesById: Readonly<Record<string, OptimisticEarnPositionUpdate>>
  vault: EarnVaultPositionMetadata | undefined
  walletAddress: string | undefined
}): EarnPositionInfo | undefined {
  if (!vault || !walletAddress) {
    return position
  }

  const latestUpdate = getLatestMatchingUpdate({
    chainIds,
    updatesById,
    vault,
    walletAddress,
  })
  if (!latestUpdate || hasApiCaughtUp({ position, update: latestUpdate })) {
    return position
  }

  if (!position && latestUpdate.action === EarnAction.Withdraw) {
    return position
  }

  const depositedUsd = Math.max(latestUpdate.depositedUsd, 0)
  const shouldClearRawBalances =
    latestUpdate.action === EarnAction.Withdraw || depositedUsd <= EARN_POSITION_USD_EPSILON
  // For a brand-new optimistic deposit (no API position yet) we only know the USD value, so
  // depositedRaw/sharesRaw stay '0'. Raw-balance consumers (e.g. a MAX_SHARES withdraw) must
  // rely on confirmed API data rather than a purely optimistic position.
  const basePosition: EarnPositionInfo = position ?? {
    vaultId: latestUpdate.vaultId,
    depositedUsd: 0,
    depositedRaw: '0',
    sharesRaw: '0',
    apyPercent: latestUpdate.vaultApyPercent ?? vault.apyPercent ?? 0,
  }

  return {
    ...basePosition,
    vaultId: latestUpdate.vaultId,
    depositedUsd,
    depositedRaw: shouldClearRawBalances ? '0' : basePosition.depositedRaw,
    sharesRaw: shouldClearRawBalances ? '0' : basePosition.sharesRaw,
  }
}

export function scheduleEarnPositionQueryRepolls(queryClient: QueryClient): void {
  EARN_POSITION_QUERY_REPOLL_DELAYS_MS.forEach((delayMs) => {
    if (delayMs === 0) {
      invalidateEarnPostTransactionQueries(queryClient)
      return
    }

    setTimeout(() => {
      invalidateEarnPostTransactionQueries(queryClient)
    }, delayMs)
  })
}

function invalidateEarnPostTransactionQueries(queryClient: QueryClient): void {
  invalidateEarnPositionQueries(queryClient)
  invalidatePortfolioBalanceQueries(queryClient)
}

export function invalidateEarnPositionQueries(queryClient: QueryClient): void {
  queryClient
    .invalidateQueries({
      queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
    })
    .catch(() => undefined)
  queryClient
    .invalidateQueries({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getEarnPosition'],
    })
    .catch(() => undefined)
}

export function invalidatePortfolioBalanceQueries(queryClient: QueryClient): void {
  queryClient
    .invalidateQueries({
      queryKey: [ReactQueryCacheKey.GetPortfolio],
    })
    .catch(() => undefined)
  queryClient
    .invalidateQueries({
      queryKey: [ReactQueryCacheKey.GetWalletBalances],
    })
    .catch(() => undefined)
}

function getLatestMatchingUpdate({
  chainIds,
  updatesById,
  vault,
  walletAddress,
}: {
  chainIds?: readonly UniverseChainId[]
  updatesById: Readonly<Record<string, OptimisticEarnPositionUpdate>>
  vault: EarnVaultPositionMetadata
  walletAddress: string
}): OptimisticEarnPositionUpdate | undefined {
  const normalizedWalletAddress = normalizeTokenAddressForCache(walletAddress)
  const vaultId = getVaultPositionId(vault)
  let latestUpdate: OptimisticEarnPositionUpdate | undefined

  for (const update of Object.values(updatesById)) {
    const chainMatches = !chainIds || chainIds.includes(update.vaultChainId)
    const updateMatchesVault =
      update.vaultId === vaultId ||
      (update.vaultChainId === vault.chainId &&
        update.vaultAddress === normalizeTokenAddressForCache(vault.vaultAddress))

    if (!chainMatches || !updateMatchesVault || update.walletAddress !== normalizedWalletAddress) {
      continue
    }

    if (!latestUpdate || update.createdAtMs > latestUpdate.createdAtMs) {
      latestUpdate = update
    }
  }

  return latestUpdate
}

function hasApiCaughtUp({
  position,
  update,
}: {
  position: EarnPositionInfo | undefined
  update: OptimisticEarnPositionUpdate
}): boolean {
  if (!position) {
    return update.action === EarnAction.Withdraw
  }

  // Shares move only when the transaction is indexed, so a directional change from the
  // chain-origin baseline is the reconciliation signal. Once shares move the update stays
  // retired — a later USD price move can't reapply it. The synthetic USD target can't do either:
  // indexing below it (price movement, slippage, fees) would mask the API value until the TTL.
  const sharesComparison = compareRawBalances(position.sharesRaw, update.baselineSharesRaw)
  if (sharesComparison !== undefined) {
    return update.action === EarnAction.Deposit ? sharesComparison > 0 : sharesComparison < 0
  }

  // Unparsable share balances — fall back to the USD target.
  if (update.action === EarnAction.Deposit) {
    return position.depositedUsd >= update.depositedUsd - EARN_POSITION_USD_EPSILON
  }

  return position.depositedUsd <= update.depositedUsd + EARN_POSITION_USD_EPSILON
}

function compareRawBalances(a: string, b: string): -1 | 0 | 1 | undefined {
  try {
    const aRaw = BigInt(a)
    const bRaw = BigInt(b)
    return aRaw === bRaw ? 0 : aRaw > bRaw ? 1 : -1
  } catch {
    return undefined
  }
}

function getVaultPositionId(vault: EarnVaultPositionMetadata): string {
  return vault.id ?? getEarnVaultId({ chainId: vault.chainId, vaultAddress: vault.vaultAddress })
}

function getNextOptimisticUpdateId(): string {
  return `earn-position-${Date.now()}-${uuid()}`
}
