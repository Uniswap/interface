import { renderHook } from '@testing-library/react'
import { useFeatureFlag } from '@universe/gating'
import { useSelector } from 'react-redux'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import {
  permanentlyDismissEarnSwapUpsell,
  recordEarnSwapUpsellQualifyingSwap,
  type UniswapBehaviorHistoryState,
} from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { EarnPositionStatus, useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import { useEarnSwapUpsellState } from 'uniswap/src/features/earn/hooks/useEarnSwapUpsellState'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { MockedFunction } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useDispatch: () => mockDispatch,
  useSelector: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/tokenProjects/tokenProjects', () => ({
  useTokenProjects: vi.fn(),
}))

vi.mock('uniswap/src/features/earn/hooks/useEarnPosition', () => ({
  EarnPositionStatus: {
    Present: 'present',
    NoPosition: 'noPosition',
    Loading: 'loading',
    Error: 'error',
  },
  useEarnPosition: vi.fn(),
}))

vi.mock('uniswap/src/features/earn/hooks/useEarnVaults', () => ({
  useEarnVaults: vi.fn(),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

const mockDispatch = vi.fn()
const mockUseFeatureFlag = vi.mocked(useFeatureFlag)
const mockUseSelector = useSelector as MockedFunction<typeof useSelector>
const mockUseTokenProjects = vi.mocked(useTokenProjects)
const mockUseEarnPosition = vi.mocked(useEarnPosition)
const mockUseEarnVaults = vi.mocked(useEarnVaults)
const mockUseCurrencyInfo = vi.mocked(useCurrencyInfo)

const WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const OUTPUT_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
const TRANSACTION_ID = 'tx-1'

const VAULT: EarnVaultInfo = {
  id: '1-0x1111111111111111111111111111111111111111',
  currencyId: OUTPUT_CURRENCY_ID,
  displayCurrencyId: OUTPUT_CURRENCY_ID,
  exposureCurrencyIds: [OUTPUT_CURRENCY_ID],
  vaultAddress: '0x1111111111111111111111111111111111111111',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 5,
  totalDepositsUsd: 1_000_000,
  liquidityUsd: 1_000_000,
  curator: { name: 'Curator', imageUrl: '' },
  deploymentDate: undefined,
}

const POSITION: EarnPositionInfo = {
  vaultId: VAULT.id,
  depositedUsd: 100,
  depositedRaw: '100000000',
  apyPercent: 5,
  sharesRaw: '1000000',
  lifetimePnlUsd: 0,
}

const ZERO_BALANCE_POSITION: EarnPositionInfo = {
  ...POSITION,
  depositedUsd: 0,
  depositedRaw: '0',
  sharesRaw: '0',
}

const onDismiss = vi.fn()

let behaviorHistoryState: UniswapBehaviorHistoryState

function setTokenHistory(earnSwapUpsell: UniswapBehaviorHistoryState['earnSwapUpsell']): void {
  behaviorHistoryState = { earnSwapUpsell }
}

function mockDataHooks({
  vaults = [VAULT],
  isLoadingVaults = false,
  position,
  positionStatus,
}: {
  vaults?: EarnVaultInfo[]
  isLoadingVaults?: boolean
  position: EarnPositionInfo | undefined
  positionStatus: ReturnType<typeof useEarnPosition>['positionStatus']
}): void {
  mockUseTokenProjects.mockReturnValue({
    data: undefined,
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })
  mockUseEarnVaults.mockReturnValue({
    isLoadingVaults,
    vaults,
  } as unknown as ReturnType<typeof useEarnVaults>)
  mockUseEarnPosition.mockReturnValue({
    position,
    positionStatus,
    isSuccess: positionStatus === EarnPositionStatus.NoPosition || positionStatus === EarnPositionStatus.Present,
    isError: positionStatus === EarnPositionStatus.Error,
    isLoading: positionStatus === EarnPositionStatus.Loading,
    refetch: vi.fn(),
  })
}

function renderEarnSwapUpsellState(overrides: { outputCurrencyId?: string; walletAddress?: string } = {}) {
  const walletAddress = 'walletAddress' in overrides ? overrides.walletAddress : WALLET_ADDRESS

  return renderHook(() =>
    useEarnSwapUpsellState({
      outputCurrencyId: overrides.outputCurrencyId ?? OUTPUT_CURRENCY_ID,
      transactionId: TRANSACTION_ID,
      walletAddress,
      onDismiss,
    }),
  )
}

function dispatchedActionTypes(): string[] {
  return mockDispatch.mock.calls.map(([action]) => (action as { type: string }).type)
}

describe(useEarnSwapUpsellState, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    behaviorHistoryState = {}
    mockUseFeatureFlag.mockReturnValue(true)
    mockUseSelector.mockImplementation((selector) =>
      selector({ uniswapBehaviorHistory: behaviorHistoryState } as unknown as UniswapState),
    )
    mockUseCurrencyInfo.mockReturnValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires no queries and records nothing when the token upsell is permanently dismissed', () => {
    setTokenHistory({ byTokenCurrencyId: { [OUTPUT_CURRENCY_ID]: { permanentlyDismissed: true } } })
    mockDataHooks({ position: undefined, positionStatus: EarnPositionStatus.Loading })

    const { result } = renderEarnSwapUpsellState()

    expect(mockUseTokenProjects).toHaveBeenCalledWith([])
    expect(mockUseEarnVaults).toHaveBeenCalledWith({ enabled: false })
    expect(mockUseEarnPosition).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(dispatchedActionTypes()).not.toContain(recordEarnSwapUpsellQualifyingSwap.type)
    expect(result.current.shouldRenderToast).toBe(false)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('uses the canonical token history key for validated token variants', () => {
    setTokenHistory({ byTokenCurrencyId: { [OUTPUT_CURRENCY_ID]: { permanentlyDismissed: true } } })
    mockDataHooks({ position: undefined, positionStatus: EarnPositionStatus.Loading })

    const { result } = renderEarnSwapUpsellState({ outputCurrencyId: OUTPUT_CURRENCY_ID.toLowerCase() })

    expect(mockUseTokenProjects).toHaveBeenCalledWith([])
    expect(mockUseEarnVaults).toHaveBeenCalledWith({ enabled: false })
    expect(dispatchedActionTypes()).not.toContain(recordEarnSwapUpsellQualifyingSwap.type)
    expect(result.current.shouldRenderToast).toBe(false)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('does not treat a disconnected wallet as confirmed no-position', () => {
    mockDataHooks({ position: undefined, positionStatus: EarnPositionStatus.NoPosition })

    const { result } = renderEarnSwapUpsellState({ walletAddress: undefined })

    expect(mockUseTokenProjects).toHaveBeenCalledWith([])
    expect(mockUseEarnVaults).toHaveBeenCalledWith({ enabled: false })
    expect(mockUseEarnPosition).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(dispatchedActionTypes()).not.toContain(recordEarnSwapUpsellQualifyingSwap.type)
    expect(result.current.shouldRenderToast).toBe(false)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('fires no queries for a token outside the launch eligible set', () => {
    const ineligibleCurrencyId = buildCurrencyId(UniverseChainId.Mainnet, '0x2222222222222222222222222222222222222222')
    mockDataHooks({ position: undefined, positionStatus: EarnPositionStatus.Loading })

    const { result } = renderEarnSwapUpsellState({ outputCurrencyId: ineligibleCurrencyId })

    expect(mockUseTokenProjects).toHaveBeenCalledWith([])
    expect(mockUseEarnVaults).toHaveBeenCalledWith({ enabled: false })
    expect(mockUseEarnPosition).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(dispatchedActionTypes()).not.toContain(recordEarnSwapUpsellQualifyingSwap.type)
    expect(result.current.shouldRenderToast).toBe(false)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('does not count or render on an errored position lookup, and dismisses after the lookup timeout', () => {
    vi.useFakeTimers()
    mockDataHooks({ position: undefined, positionStatus: EarnPositionStatus.Error })

    const { result } = renderEarnSwapUpsellState()

    expect(dispatchedActionTypes()).not.toContain(recordEarnSwapUpsellQualifyingSwap.type)
    expect(result.current.shouldRenderToast).toBe(false)
    // An errored lookup is unknown, not confirmed no-position: no eager dismissal — the lookup
    // timeout advances the queue instead, same as an unresolved lookup.
    expect(onDismiss).not.toHaveBeenCalled()

    vi.advanceTimersByTime(10_000)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('counts a confirmed no-position swap once per transaction id and renders the toast', () => {
    mockDataHooks({ position: undefined, positionStatus: EarnPositionStatus.NoPosition })

    const { result, rerender } = renderEarnSwapUpsellState()

    expect(mockDispatch).toHaveBeenCalledWith(
      recordEarnSwapUpsellQualifyingSwap({
        tokenCurrencyId: OUTPUT_CURRENCY_ID,
        transactionId: TRANSACTION_ID,
      }),
    )
    expect(dispatchedActionTypes().filter((type) => type === recordEarnSwapUpsellQualifyingSwap.type)).toHaveLength(1)
    // Optimistic display history shows the toast without waiting for the Redux roundtrip.
    expect(result.current.shouldRenderToast).toBe(true)

    // Once persisted, re-renders must not double-count the same transaction.
    setTokenHistory({
      byTokenCurrencyId: {
        [OUTPUT_CURRENCY_ID]: {
          qualifyingSwapCount: 1,
          interactionCount: 0,
          countedTransactionIds: { [TRANSACTION_ID]: true },
        },
      },
    })
    rerender()

    expect(dispatchedActionTypes().filter((type) => type === recordEarnSwapUpsellQualifyingSwap.type)).toHaveLength(1)
    expect(result.current.shouldRenderToast).toBe(true)
  })

  it('records canonical token ids for validated token variants', () => {
    mockDataHooks({ position: undefined, positionStatus: EarnPositionStatus.NoPosition })

    renderEarnSwapUpsellState({ outputCurrencyId: OUTPUT_CURRENCY_ID.toLowerCase() })

    expect(mockDispatch).toHaveBeenCalledWith(
      recordEarnSwapUpsellQualifyingSwap({
        tokenCurrencyId: OUTPUT_CURRENCY_ID,
        transactionId: TRANSACTION_ID,
      }),
    )
  })

  it('permanently dismisses the upsell and dismisses when the user already has a position', () => {
    mockDataHooks({ position: POSITION, positionStatus: EarnPositionStatus.Present })

    const { result } = renderEarnSwapUpsellState()

    expect(mockDispatch).toHaveBeenCalledWith(permanentlyDismissEarnSwapUpsell({ tokenCurrencyId: OUTPUT_CURRENCY_ID }))
    expect(dispatchedActionTypes()).not.toContain(recordEarnSwapUpsellQualifyingSwap.type)
    expect(result.current.shouldRenderToast).toBe(false)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('treats a zero-balance position row as no active position', () => {
    mockDataHooks({ position: ZERO_BALANCE_POSITION, positionStatus: EarnPositionStatus.Present })

    const { result } = renderEarnSwapUpsellState()

    expect(mockDispatch).toHaveBeenCalledWith(
      recordEarnSwapUpsellQualifyingSwap({
        tokenCurrencyId: OUTPUT_CURRENCY_ID,
        transactionId: TRANSACTION_ID,
      }),
    )
    expect(dispatchedActionTypes()).not.toContain(permanentlyDismissEarnSwapUpsell.type)
    expect(result.current.shouldRenderToast).toBe(true)
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
