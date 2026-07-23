import { act, renderHook } from '@testing-library/react'
import { useAcceptedTrade } from 'uniswap/src/features/transactions/swap/review/hooks/useAcceptedTrade'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'

const mockDispatch = vi.fn()
vi.mock('react-redux', () => ({
  useDispatch: (): unknown => mockDispatch,
}))

vi.mock('@universe/environment', () => ({
  isWebApp: true,
}))

const mockRequireAcceptNewTrade = vi.fn()
vi.mock('uniswap/src/features/transactions/swap/utils/trade', () => ({
  requireAcceptNewTrade: (oldTrade: unknown, newTrade: unknown): boolean =>
    mockRequireAcceptNewTrade(oldTrade, newTrade),
}))

function createDerivedSwapInfo(trade: Trade): DerivedSwapInfo {
  return { trade: { trade, indicativeTrade: undefined } } as unknown as DerivedSwapInfo
}

const CLASSIC_TRADE = { id: 'classic' } as unknown as Trade
const UPDATED_CLASSIC_TRADE = { id: 'updated-classic' } as unknown as Trade
const EARN_TRADE = { id: 'earn', earnIntent: { action: 'DEPOSIT' } } as unknown as Trade

describe(useAcceptedTrade, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAcceptNewTrade.mockReturnValue(false)
  })

  it('auto-accepts the first valid trade', () => {
    const derivedSwapInfo = createDerivedSwapInfo(CLASSIC_TRADE)

    const { result } = renderHook(() => useAcceptedTrade({ derivedSwapInfo, isSubmitting: false }))

    expect(result.current.acceptedDerivedSwapInfo).toBe(derivedSwapInfo)
    expect(result.current.newTradeRequiresAcceptance).toBe(false)
  })

  it('requires acceptance for an earn-intent change whose price moved materially (no auto-accept)', () => {
    const classicInfo = createDerivedSwapInfo(CLASSIC_TRADE)
    const earnInfo = createDerivedSwapInfo(EARN_TRADE)

    const { result, rerender } = renderHook(
      ({ derivedSwapInfo }) => useAcceptedTrade({ derivedSwapInfo, isSubmitting: false }),
      { initialProps: { derivedSwapInfo: classicInfo } },
    )
    expect(result.current.acceptedDerivedSwapInfo).toBe(classicInfo)

    // The earn re-quote arrives with a materially different price — previously the earn-intent key
    // change suppressed the prompt and silently auto-accepted; now the user must accept.
    mockRequireAcceptNewTrade.mockReturnValue(true)
    rerender({ derivedSwapInfo: earnInfo })

    expect(result.current.newTradeRequiresAcceptance).toBe(true)
    expect(result.current.acceptedDerivedSwapInfo).toBe(classicInfo)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('interrupts the transaction flow for non-earn material quote changes', () => {
    const classicInfo = createDerivedSwapInfo(CLASSIC_TRADE)
    const updatedClassicInfo = createDerivedSwapInfo(UPDATED_CLASSIC_TRADE)

    const { result, rerender } = renderHook(
      ({ derivedSwapInfo }) => useAcceptedTrade({ derivedSwapInfo, isSubmitting: false }),
      { initialProps: { derivedSwapInfo: classicInfo } },
    )
    expect(result.current.acceptedDerivedSwapInfo).toBe(classicInfo)

    mockRequireAcceptNewTrade.mockReturnValue(true)
    rerender({ derivedSwapInfo: updatedClassicInfo })

    expect(result.current.newTradeRequiresAcceptance).toBe(true)
    expect(result.current.acceptedDerivedSwapInfo).toBe(classicInfo)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
  })

  it('auto-accepts an earn-intent change whose price stayed within threshold', () => {
    const classicInfo = createDerivedSwapInfo(CLASSIC_TRADE)
    const earnInfo = createDerivedSwapInfo(EARN_TRADE)

    const { result, rerender } = renderHook(
      ({ derivedSwapInfo }) => useAcceptedTrade({ derivedSwapInfo, isSubmitting: false }),
      { initialProps: { derivedSwapInfo: classicInfo } },
    )
    expect(result.current.acceptedDerivedSwapInfo).toBe(classicInfo)

    rerender({ derivedSwapInfo: earnInfo })

    expect(result.current.newTradeRequiresAcceptance).toBe(false)
    expect(result.current.acceptedDerivedSwapInfo).toBe(earnInfo)
  })

  it('accepts the pending trade when onAcceptTrade is invoked', () => {
    const classicInfo = createDerivedSwapInfo(CLASSIC_TRADE)
    const earnInfo = createDerivedSwapInfo(EARN_TRADE)

    const { result, rerender } = renderHook(
      ({ derivedSwapInfo }) => useAcceptedTrade({ derivedSwapInfo, isSubmitting: false }),
      { initialProps: { derivedSwapInfo: classicInfo } },
    )

    mockRequireAcceptNewTrade.mockReturnValue(true)
    rerender({ derivedSwapInfo: earnInfo })
    expect(result.current.acceptedDerivedSwapInfo).toBe(classicInfo)

    act(() => {
      result.current.onAcceptTrade()
    })
    rerender({ derivedSwapInfo: earnInfo })

    expect(result.current.acceptedDerivedSwapInfo).toBe(earnInfo)
  })
})
