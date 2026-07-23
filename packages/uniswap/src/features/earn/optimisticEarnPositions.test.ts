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

const WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const VAULT: EarnVaultInfo = {
  id: '1-0xvault',
  currencyId: '1-0xusdc',
  displayCurrencyId: '1-0xusdc',
  vaultAddress: '0xVault',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 5,
  exposureCurrencyIds: ['1-0xusdc'],
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

  it('clears raw balances for an optimistic full withdraw', () => {
    const position = applyOptimisticEarnPositionUpdate({
      position: createPosition(),
      updatesById: {
        'update-1': createUpdate({ action: EarnAction.Withdraw, depositedUsd: 0 }),
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
        'update-1': createUpdate({ action: EarnAction.Withdraw, depositedUsd: 60 }),
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

    vi.advanceTimersByTime(30_000)

    expect(invalidateQueries).toHaveBeenCalledTimes(20)
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
        vaultId: VAULT.id,
      }),
    ])
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

    vi.advanceTimersByTime(30_000)
    invalidateQueries.mockClear()

    vi.advanceTimersByTime(29_999)
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
