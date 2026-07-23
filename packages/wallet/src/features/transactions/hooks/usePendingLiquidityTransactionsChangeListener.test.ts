import { usePendingTransactions } from 'uniswap/src/features/transactions/hooks/usePendingTransactions'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { MockedFunction } from 'vitest'
import { usePendingLiquidityTransactionsChangeListener } from 'wallet/src/features/transactions/hooks/usePendingLiquidityTransactionsChangeListener'
import { renderHook } from 'wallet/src/test/test-utils'

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(() => ({ evmAddress: '0xabc', svmAddress: null })),
}))

vi.mock('uniswap/src/features/transactions/hooks/usePendingTransactions', () => ({
  usePendingTransactions: vi.fn(),
}))

const mockUsePendingTransactions = usePendingTransactions as MockedFunction<typeof usePendingTransactions>

// Minimal pending-tx shape — the hook only reads `typeInfo.type`.
const tx = (type: TransactionType): { typeInfo: { type: TransactionType } } => ({ typeInfo: { type } })

describe('usePendingLiquidityTransactionsChangeListener', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fire the callback on mount', () => {
    mockUsePendingTransactions.mockReturnValue([tx(TransactionType.LiquidityIncrease)] as never)
    const callback = vi.fn()

    renderHook(() => usePendingLiquidityTransactionsChangeListener(callback))

    expect(callback).not.toHaveBeenCalled()
  })

  it('fires the callback when the pending LP count changes (settle: 1 -> 0)', () => {
    mockUsePendingTransactions.mockReturnValue([tx(TransactionType.LiquidityDecrease)] as never)
    const callback = vi.fn()

    const { rerender } = renderHook(() => usePendingLiquidityTransactionsChangeListener(callback))
    expect(callback).not.toHaveBeenCalled()

    mockUsePendingTransactions.mockReturnValue([] as never)
    rerender()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('fires the callback when a new LP tx is submitted (0 -> 1)', () => {
    mockUsePendingTransactions.mockReturnValue([] as never)
    const callback = vi.fn()

    const { rerender } = renderHook(() => usePendingLiquidityTransactionsChangeListener(callback))

    mockUsePendingTransactions.mockReturnValue([tx(TransactionType.CollectFees)] as never)
    rerender()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('ignores non-LP pending transactions', () => {
    mockUsePendingTransactions.mockReturnValue([tx(TransactionType.Swap)] as never)
    const callback = vi.fn()

    const { rerender } = renderHook(() => usePendingLiquidityTransactionsChangeListener(callback))

    // Another non-LP tx appears — LP count stays 0, so no callback.
    mockUsePendingTransactions.mockReturnValue([tx(TransactionType.Swap), tx(TransactionType.Send)] as never)
    rerender()

    expect(callback).not.toHaveBeenCalled()
  })

  it('does not fire when the LP count is unchanged across renders', () => {
    mockUsePendingTransactions.mockReturnValue([tx(TransactionType.CreatePool)] as never)
    const callback = vi.fn()

    const { rerender } = renderHook(() => usePendingLiquidityTransactionsChangeListener(callback))
    rerender()
    rerender()

    expect(callback).not.toHaveBeenCalled()
  })
})
