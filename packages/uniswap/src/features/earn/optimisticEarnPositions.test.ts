import type { QueryClient } from '@tanstack/react-query'
import { TradingApi } from '@universe/api'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  applyEarnPositionChangeOptimistically,
  applyOptimisticEarnPositionUpdate,
  applyOptimisticEarnPositionUpdates,
  scheduleEarnPositionQueryRepolls,
  type OptimisticEarnPositionUpdate,
  useOptimisticEarnPositionStore,
} from 'uniswap/src/features/earn/optimisticEarnPositions'
import { EarnAction, type EarnPositionInfo, type EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const VAULT: EarnVaultInfo = {
  id: '1-0xvault',
  currencyId: '1-0xusdc',
  displayCurrencyId: '1-0xusdc',
  vaultAddress: '0xVault',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 5,
  exposureCurrencyIds: ['1-0xusdc'],
  exposures: [],
  totalDepositsUsd: 1_000_000,
  liquidityUsd: 1_000_000,
  curator: { name: 'Uniswap' },
}

function createUpdate(override: Partial<OptimisticEarnPositionUpdate> = {}): OptimisticEarnPositionUpdate {
  return {
    id: 'update-1',
    action: EarnAction.Deposit,
    createdAtMs: 1,
    depositedUsd: 250,
    baselineSharesRaw: '0',
    walletAddress: normalizeTokenAddressForCache(WALLET_ADDRESS),
    vaultAddress: normalizeTokenAddressForCache(VAULT.vaultAddress),
    vaultChainId: VAULT.chainId,
    vaultId: VAULT.id,
    vaultApyPercent: VAULT.apyPercent,
    ...override,
  }
}

function createPosition(override: Partial<EarnPositionInfo> = {}): EarnPositionInfo {
  return {
    vaultId: VAULT.id,
    depositedUsd: 100,
    depositedRaw: '100000000',
    sharesRaw: '1000000000000000000',
    apyPercent: VAULT.apyPercent,
    ...override,
  }
}

describe('optimisticEarnPositions', () => {
  beforeEach(() => {
    useOptimisticEarnPositionStore.getState().clearUpdates()
  })

  afterEach(() => {
    useOptimisticEarnPositionStore.getState().clearUpdates()
    vi.useRealTimers()
  })

  it('creates an optimistic deposited position before the API returns one', () => {
    const positionsByVaultId = applyOptimisticEarnPositionUpdates({
      positionsByVaultId: new Map(),
      updatesById: { 'update-1': createUpdate() },
      vaults: [VAULT],
      walletAddress: WALLET_ADDRESS,
    })

    expect(positionsByVaultId.get(VAULT.id)).toEqual({
      vaultId: VAULT.id,
      depositedUsd: 250,
      depositedRaw: '0',
      sharesRaw: '0',
      apyPercent: VAULT.apyPercent,
    })
  })

  it('uses the current vault APY when the optimistic update has no APY snapshot', () => {
    const position = applyOptimisticEarnPositionUpdate({
      position: undefined,
      updatesById: { 'update-1': createUpdate({ vaultApyPercent: undefined }) },
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(position?.apyPercent).toBe(VAULT.apyPercent)
  })

  it('does not double count once the API has caught up to an optimistic deposit', () => {
    const apiPosition = createPosition({ depositedUsd: 251 })

    const position = applyOptimisticEarnPositionUpdate({
      position: apiPosition,
      updatesById: { 'update-1': createUpdate({ depositedUsd: 250 }) },
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(position).toBe(apiPosition)
  })

  it('retires a deposit that indexes below the synthetic USD target once shares move', () => {
    // $100 position + $50 deposit indexed at $149.98 (price movement/slippage/fees).
    const apiPosition = createPosition({ depositedUsd: 149.98, sharesRaw: '1500' })

    const position = applyOptimisticEarnPositionUpdate({
      position: apiPosition,
      updatesById: { 'update-1': createUpdate({ depositedUsd: 150, baselineSharesRaw: '1000' }) },
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(position).toBe(apiPosition)
  })

  it('keeps the optimistic deposit while shares are unchanged even if USD crosses the target', () => {
    // A price rally can push the stale pre-deposit position past the USD target; unchanged shares
    // mean the deposit is still unindexed, so the optimistic value stays.
    const apiPosition = createPosition({ depositedUsd: 155, sharesRaw: '1000' })

    const position = applyOptimisticEarnPositionUpdate({
      position: apiPosition,
      updatesById: { 'update-1': createUpdate({ depositedUsd: 150, baselineSharesRaw: '1000' }) },
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(position?.depositedUsd).toBe(150)
  })

  it('retires a withdrawal that indexes above the synthetic USD target once shares decrease', () => {
    // $150 position − $50 withdrawal indexed at $100.5 after a price gain.
    const apiPosition = createPosition({ depositedUsd: 100.5, sharesRaw: '1300' })

    const position = applyOptimisticEarnPositionUpdate({
      position: apiPosition,
      updatesById: {
        'update-1': createUpdate({ action: EarnAction.Withdraw, depositedUsd: 100, baselineSharesRaw: '2000' }),
      },
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(position).toBe(apiPosition)
  })

  it('falls back to the USD target when share balances are unparsable', () => {
    const apiPosition = createPosition({ depositedUsd: 251, sharesRaw: 'unknown' })

    const position = applyOptimisticEarnPositionUpdate({
      position: apiPosition,
      updatesById: { 'update-1': createUpdate({ depositedUsd: 250, baselineSharesRaw: '1000' }) },
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(position).toBe(apiPosition)
  })

  it('clears raw balances for an optimistic full withdraw', () => {
    const position = applyOptimisticEarnPositionUpdate({
      position: createPosition(),
      updatesById: {
        'update-1': createUpdate({
          action: EarnAction.Withdraw,
          depositedUsd: 0,
          baselineSharesRaw: '1000000000000000000',
        }),
      },
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(position).toMatchObject({
      depositedUsd: 0,
      depositedRaw: '0',
      sharesRaw: '0',
    })
  })

  it('clears raw balances for an optimistic partial withdraw', () => {
    const position = applyOptimisticEarnPositionUpdate({
      position: createPosition(),
      updatesById: {
        'update-1': createUpdate({
          action: EarnAction.Withdraw,
          depositedUsd: 60,
          baselineSharesRaw: '1000000000000000000',
        }),
      },
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(position).toMatchObject({
      depositedUsd: 60,
      depositedRaw: '0',
      sharesRaw: '0',
    })
  })

  it('repolls Earn position queries after transaction success', () => {
    vi.useFakeTimers()
    const invalidateQueries = vi.fn(() => Promise.resolve())
    const queryClient = { invalidateQueries } as unknown as QueryClient

    scheduleEarnPositionQueryRepolls(queryClient)

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getEarnPosition'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.GetPortfolio],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.GetWalletBalances],
    })

    vi.advanceTimersByTime(4 * ONE_MINUTE_MS)

    expect(invalidateQueries).toHaveBeenCalledTimes(32)
  })

  it('adds an optimistic position update for a completed deposit', () => {
    vi.useFakeTimers()
    const queryClient = {
      invalidateQueries: vi.fn(() => Promise.resolve()),
    } as unknown as QueryClient

    applyEarnPositionChangeOptimistically({
      action: EarnAction.Deposit,
      amount: '50',
      currentPosition: createPosition({ depositedUsd: 100 }),
      localFiatToUsd: (amount) => amount,
      queryClient,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(Object.values(useOptimisticEarnPositionStore.getState().updatesById)).toEqual([
      expect.objectContaining({
        action: EarnAction.Deposit,
        depositedUsd: 150,
        baselineSharesRaw: '1000000000000000000',
        vaultId: VAULT.id,
      }),
    ])
  })

  it('inherits the chain-origin baseline for a deposit stacked on an unindexed full withdraw', () => {
    vi.useFakeTimers()
    const queryClient = {
      invalidateQueries: vi.fn(() => Promise.resolve()),
    } as unknown as QueryClient
    const apiPosition = createPosition({ depositedUsd: 100 })

    applyEarnPositionChangeOptimistically({
      action: EarnAction.Withdraw,
      amount: '100',
      currentPosition: apiPosition,
      localFiatToUsd: (amount) => amount,
      queryClient,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
      withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
    })
    vi.advanceTimersByTime(1)

    // The deposit is created from the position the UI holds: the withdraw overlay with zeroed shares.
    const overlaidPosition = applyOptimisticEarnPositionUpdate({
      position: apiPosition,
      updatesById: useOptimisticEarnPositionStore.getState().updatesById,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })
    expect(overlaidPosition?.sharesRaw).toBe('0')

    applyEarnPositionChangeOptimistically({
      action: EarnAction.Deposit,
      amount: '50',
      currentPosition: overlaidPosition,
      localFiatToUsd: (amount) => amount,
      queryClient,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    const updates = Object.values(useOptimisticEarnPositionStore.getState().updatesById)
    expect(updates).toHaveLength(2)
    expect(updates.map((update) => update.baselineSharesRaw)).toEqual(['1000000000000000000', '1000000000000000000'])

    // Nothing indexed yet: the stacked deposit masks with its own value instead of retiring
    // against the pre-withdraw shares and snapping back to the stale API balance.
    const displayedBeforeIndexing = applyOptimisticEarnPositionUpdate({
      position: apiPosition,
      updatesById: useOptimisticEarnPositionStore.getState().updatesById,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })
    expect(displayedBeforeIndexing?.depositedUsd).toBe(50)

    // Withdraw indexed (shares cleared), deposit still pending: keep masking with the deposit.
    const displayedAfterWithdrawIndexes = applyOptimisticEarnPositionUpdate({
      position: createPosition({ depositedUsd: 0, depositedRaw: '0', sharesRaw: '0' }),
      updatesById: useOptimisticEarnPositionStore.getState().updatesById,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })
    expect(displayedAfterWithdrawIndexes?.depositedUsd).toBe(50)
  })

  it('invalidates Earn position queries when an optimistic update expires', () => {
    vi.useFakeTimers()
    const invalidateQueries = vi.fn(() => Promise.resolve())
    const queryClient = { invalidateQueries } as unknown as QueryClient

    applyEarnPositionChangeOptimistically({
      action: EarnAction.Deposit,
      amount: '50',
      currentPosition: createPosition({ depositedUsd: 100 }),
      localFiatToUsd: (amount) => amount,
      queryClient,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    const updateId = Object.keys(useOptimisticEarnPositionStore.getState().updatesById)[0]
    expect(updateId).toBeDefined()

    vi.advanceTimersByTime(2 * ONE_MINUTE_MS)
    expect(useOptimisticEarnPositionStore.getState().updatesById[updateId!]).toBeDefined()

    vi.advanceTimersByTime(3 * ONE_MINUTE_MS - 1)
    invalidateQueries.mockClear()

    expect(useOptimisticEarnPositionStore.getState().updatesById[updateId!]).toBeDefined()
    expect(invalidateQueries).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)

    expect(useOptimisticEarnPositionStore.getState().updatesById[updateId!]).toBeUndefined()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getEarnPosition'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.GetPortfolio],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.GetWalletBalances],
    })
    expect(invalidateQueries).toHaveBeenCalledTimes(4)
  })

  it('adds an optimistic zero-balance update for a completed max withdraw', () => {
    vi.useFakeTimers()
    const queryClient = {
      invalidateQueries: vi.fn(() => Promise.resolve()),
    } as unknown as QueryClient

    applyEarnPositionChangeOptimistically({
      action: EarnAction.Withdraw,
      amount: '50',
      currentPosition: createPosition({ depositedUsd: 100 }),
      localFiatToUsd: (amount) => amount,
      queryClient,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
      withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
    })

    expect(Object.values(useOptimisticEarnPositionStore.getState().updatesById)).toEqual([
      expect.objectContaining({
        action: EarnAction.Withdraw,
        depositedUsd: 0,
        vaultId: VAULT.id,
      }),
    ])
  })

  it('subtracts the requested amount for a completed exact-assets withdraw', () => {
    vi.useFakeTimers()
    const queryClient = {
      invalidateQueries: vi.fn(() => Promise.resolve()),
    } as unknown as QueryClient

    applyEarnPositionChangeOptimistically({
      action: EarnAction.Withdraw,
      amount: '40',
      currentPosition: createPosition({ depositedUsd: 100 }),
      localFiatToUsd: (amount) => amount,
      queryClient,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
      withdrawMode: TradingApi.EarnWithdrawMode.EXACT_ASSETS,
    })

    expect(Object.values(useOptimisticEarnPositionStore.getState().updatesById)).toEqual([
      expect.objectContaining({
        action: EarnAction.Withdraw,
        depositedUsd: 60,
        vaultId: VAULT.id,
      }),
    ])
  })

  it('falls back to the local fiat amount when USD conversion is unavailable', () => {
    vi.useFakeTimers()
    const queryClient = {
      invalidateQueries: vi.fn(() => Promise.resolve()),
    } as unknown as QueryClient

    applyEarnPositionChangeOptimistically({
      action: EarnAction.Deposit,
      amount: '50',
      currentPosition: createPosition({ depositedUsd: 100 }),
      localFiatToUsd: () => undefined,
      queryClient,
      vault: VAULT,
      walletAddress: WALLET_ADDRESS,
    })

    expect(Object.values(useOptimisticEarnPositionStore.getState().updatesById)).toEqual([
      expect.objectContaining({
        action: EarnAction.Deposit,
        depositedUsd: 150,
        vaultId: VAULT.id,
      }),
    ])
  })
})
