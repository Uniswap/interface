import { renderHook } from '@testing-library/react'
import { PlanStatus } from '@uniswap/client-data-api/dist/data/v1/plan_pb'
import { OnChainTransactionStatus, UniswapXTransactionStatus } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { setNewUserOnboardingWalletFlag } from 'uniswap/src/features/behaviorHistory/slice'
import {
  getNewUserOnboardingState,
  useNewUserOnboardingState,
} from 'uniswap/src/features/onboarding/useNewUserOnboardingState'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  balance: {
    data: undefined as { balanceUSD: number } | undefined,
    isPending: false,
    isPlaceholderData: false,
  },
  swapHistory: {
    transactions: [] as unknown[],
    isPending: false,
    isPlaceholderData: false,
  },
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: (): boolean => true,
}))
vi.mock('react-redux', () => ({
  useDispatch: (): typeof mocks.dispatch => mocks.dispatch,
  useSelector: (): undefined => undefined,
}))
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddresses: (): { evmAddress: string } => ({ evmAddress: '0xfresh' }),
}))
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: (): { isTestnetModeEnabled: boolean; chains: number[] } => ({
    isTestnetModeEnabled: false,
    chains: [1],
  }),
}))
vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioTotalValue: (): typeof mocks.balance => mocks.balance,
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/activity/listTransactions', () => ({
  getListTransactionsQuery: <T>(options: T): T => options,
}))
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: ({ select }: { select: (data: unknown) => boolean }) => ({
    data: select({ transactions: mocks.swapHistory.transactions }),
    isPending: mocks.swapHistory.isPending,
    isPlaceholderData: mocks.swapHistory.isPlaceholderData,
  }),
}))

type StateInput = Parameters<typeof getNewUserOnboardingState>[0]

const BASE_INPUT: StateInput = {
  isActive: true,
  walletHistory: undefined,
  isTestnetModeEnabled: false,
  balanceUSD: 0,
  isBalanceLoading: false,
  hasRemoteSwap: false,
  isSwapHistoryLoading: false,
}

function getState(overrides: Partial<StateInput> = {}): ReturnType<typeof getNewUserOnboardingState> {
  return getNewUserOnboardingState({ ...BASE_INPUT, ...overrides })
}

describe(getNewUserOnboardingState, () => {
  it('shows the nudges to a new, unfunded wallet', () => {
    expect(getState()).toEqual({
      isActive: true,
      isReturningUser: false,
      showOnboardingNudges: true,
      isLoading: false,
      isFunded: false,
      hasSwapped: false,
      hasDismissedGuidedSwap: false,
    })
  })

  it('shows nothing when the flag is off or no wallet is connected', () => {
    const state = getState({
      isActive: false,
      balanceUSD: undefined,
      isBalanceLoading: true,
      isSwapHistoryLoading: true,
    })
    expect(state.showOnboardingNudges).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  describe('loading', () => {
    it('treats a loading balance as unknown, not $0', () => {
      const state = getState({ balanceUSD: undefined, isBalanceLoading: true })
      expect(state.isLoading).toBe(true)
      expect(state.showOnboardingNudges).toBe(false)
    })

    it('does not wait for the balance once the wallet was funded', () => {
      const state = getState({
        balanceUSD: undefined,
        isBalanceLoading: true,
        walletHistory: { hasBeenFunded: true },
      })
      expect(state.isLoading).toBe(false)
      expect(state.isFunded).toBe(true)
    })

    it('does not wait for the balance in testnet mode', () => {
      expect(getState({ balanceUSD: undefined, isBalanceLoading: true, isTestnetModeEnabled: true }).isLoading).toBe(
        false,
      )
    })

    it('waits for the remote swap history', () => {
      expect(getState({ hasRemoteSwap: undefined, isSwapHistoryLoading: true }).isLoading).toBe(true)
    })

    it('does not wait for the remote swap history once the wallet swapped here', () => {
      const state = getState({
        hasRemoteSwap: undefined,
        isSwapHistoryLoading: true,
        walletHistory: { hasCompletedSwap: true },
      })
      expect(state.isLoading).toBe(false)
    })
  })

  describe('unconfirmed', () => {
    it.each([
      ['balance', { balanceUSD: undefined, hasRemoteSwap: true }],
      ['swap history', { balanceUSD: 10, hasRemoteSwap: undefined }],
      ['balance and swap history', { balanceUSD: undefined, hasRemoteSwap: undefined }],
    ])('hides the nudges when the %s failed and nothing else is left', (_, overrides) => {
      const state = getState(overrides)
      expect(state.isLoading).toBe(false)
      expect(state.isReturningUser).toBe(false)
      expect(state.showOnboardingNudges).toBe(false)
    })

    it.each([
      ['balance', { balanceUSD: undefined, hasRemoteSwap: false }],
      ['swap history', { balanceUSD: 0, hasRemoteSwap: undefined }],
    ])('shows the nudges when the %s failed but the other step is confirmed left', (_, overrides) => {
      expect(getState(overrides).showOnboardingNudges).toBe(true)
    })
  })

  describe('funded', () => {
    it.each([
      [{ balanceUSD: 12 }, true],
      [{ balanceUSD: 0 }, false],
      [{ balanceUSD: 0, walletHistory: { hasBeenFunded: true } }, true],
      [{ balanceUSD: 0, isTestnetModeEnabled: true }, true],
    ])('%o -> %s', (overrides, expected) => {
      expect(getState(overrides).isFunded).toBe(expected)
    })
  })

  describe('has swapped', () => {
    it.each([
      [{ hasRemoteSwap: true }, true],
      [{ walletHistory: { hasCompletedSwap: true } }, true],
      [{ hasRemoteSwap: undefined }, false],
    ])('%o -> %s', (overrides, expected) => {
      expect(getState(overrides).hasSwapped).toBe(expected)
    })
  })

  describe('returning users', () => {
    it.each([
      [{ balanceUSD: 10, hasRemoteSwap: true }],
      [{ walletHistory: { hasBeenFunded: true, hasCompletedSwap: true } }],
    ])('treats the connected wallet as returning for %o', (overrides) => {
      const state = getState(overrides)
      expect(state.isReturningUser).toBe(true)
      expect(state.showOnboardingNudges).toBe(false)
    })

    it.each([[{ balanceUSD: 10 }], [{ hasRemoteSwap: true }]])(
      'keeps showing the nudges while a step is left: %o',
      (overrides) => {
        const state = getState(overrides)
        expect(state.isReturningUser).toBe(false)
        expect(state.showOnboardingNudges).toBe(true)
      },
    )
  })

  it('keeps the rest of the onboarding after the guided swap coachmarks are dismissed', () => {
    const state = getState({ walletHistory: { guidedSwapDismissed: true } })
    expect(state.hasDismissedGuidedSwap).toBe(true)
    expect(state.isReturningUser).toBe(false)
    expect(state.showOnboardingNudges).toBe(true)
  })
})

describe(useNewUserOnboardingState, () => {
  const row = (txCase: string, status: number, value: Record<string, unknown> = {}): unknown => ({
    transaction: { case: txCase, value: { status, ...value } },
  })
  const confirmedSwap = row('onChain', OnChainTransactionStatus.CONFIRMED)

  beforeEach(() => {
    mocks.dispatch.mockClear()
    mocks.balance = { data: { balanceUSD: 0 }, isPending: false, isPlaceholderData: false }
    mocks.swapHistory = { transactions: [], isPending: false, isPlaceholderData: false }
  })

  it("doesn't save the previous wallet's placeholder data under the new wallet", () => {
    mocks.balance = { data: { balanceUSD: 100 }, isPending: false, isPlaceholderData: true }
    mocks.swapHistory = { transactions: [confirmedSwap], isPending: false, isPlaceholderData: true }

    const { result } = renderHook(() => useNewUserOnboardingState())

    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.showOnboardingNudges).toBe(false)
  })

  it('saves funded and swapped once the wallet has its own data', () => {
    mocks.balance = { data: { balanceUSD: 100 }, isPending: false, isPlaceholderData: false }
    mocks.swapHistory = { transactions: [confirmedSwap], isPending: false, isPlaceholderData: false }

    renderHook(() => useNewUserOnboardingState())

    expect(mocks.dispatch).toHaveBeenCalledWith(
      setNewUserOnboardingWalletFlag({ address: '0xfresh', flag: 'hasBeenFunded' }),
    )
    expect(mocks.dispatch).toHaveBeenCalledWith(
      setNewUserOnboardingWalletFlag({ address: '0xfresh', flag: 'hasCompletedSwap' }),
    )
  })

  it.each([
    ['open UniswapX order', row('uniswapX', UniswapXTransactionStatus.OPEN)],
    ['expired UniswapX order', row('uniswapX', UniswapXTransactionStatus.EXPIRED)],
    ['cancelled UniswapX order', row('uniswapX', UniswapXTransactionStatus.CANCELLED)],
    ['failed onchain swap', row('onChain', OnChainTransactionStatus.FAILED)],
    ['pending onchain swap', row('onChain', OnChainTransactionStatus.PENDING)],
    ['failed plan', row('plan', PlanStatus.FAILED)],
    ['completed earn plan', row('plan', PlanStatus.COMPLETED, { earnMetadata: {} })],
  ])("doesn't count a %s as a swap", (_, transaction) => {
    mocks.swapHistory.transactions = [transaction]
    expect(renderHook(() => useNewUserOnboardingState()).result.current.hasSwapped).toBe(false)
  })

  it.each([
    ['confirmed onchain swap', confirmedSwap],
    ['filled UniswapX order', row('uniswapX', UniswapXTransactionStatus.FILLED)],
    ['completed plan', row('plan', PlanStatus.COMPLETED)],
  ])('counts a %s behind unfinished attempts', (_, transaction) => {
    mocks.swapHistory.transactions = [row('uniswapX', UniswapXTransactionStatus.EXPIRED), transaction]
    expect(renderHook(() => useNewUserOnboardingState()).result.current.hasSwapped).toBe(true)
  })
})
