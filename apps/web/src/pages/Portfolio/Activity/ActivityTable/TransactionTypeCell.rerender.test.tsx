import { useFeatureFlag } from '@universe/gating'
import { CANCEL_TX_TIMEOUT_MS } from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { stampCancelAlertShown, transactionReducer, TransactionsState } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { Mock } from 'vitest'
import { TransactionTypeCell } from '~/pages/Portfolio/Activity/ActivityTable/TransactionTypeCell'
import { render, screen } from '~/test-utils/render'
import { createMockUniswapXOrder } from '~/test-utils/transactions/fixtures'

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: vi.fn(),
}))

const NOW = 1_700_000_000_000
const WARNING_TEXT = 'Cancellation likely to fail — tap to review'

describe('TransactionTypeCell timed-out cancellation re-render (B1)', () => {
  beforeEach(() => {
    ;(useFeatureFlag as Mock).mockReturnValue(true)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flips the memoized cell to the warning treatment via the poller alert stamp, not wall-clock alone', () => {
    const order: UniswapXOrderDetails = createMockUniswapXOrder({
      status: TransactionStatus.Cancelling,
      cancelTxHash: '0xcanceltx',
      cancelBroadcastTimeMs: NOW,
      cancelTimeoutAtMs: NOW + CANCEL_TX_TIMEOUT_MS,
    })

    // Before the deadline: spinner treatment, no warning
    const { rerender } = render(<TransactionTypeCell transaction={order} />)
    expect(screen.queryByText(WARNING_TEXT)).not.toBeInTheDocument()

    // Deadline passes with NO redux write: the memo sees the same order reference, so the row
    // stays stale — this is the failure mode the poller's stamp exists to break
    vi.setSystemTime(NOW + CANCEL_TX_TIMEOUT_MS + 60_000)
    rerender(<TransactionTypeCell transaction={order} />)
    expect(screen.queryByText(WARNING_TEXT)).not.toBeInTheDocument()

    // The poller's timeout-alert arm dispatches stampCancelAlertShown: Immer hands back a fresh
    // order object, which is exactly what invalidates the memo and re-renders the row
    const state: TransactionsState = { [order.from]: { [order.chainId]: { [order.id]: order } } }
    const nextState = transactionReducer(
      state,
      stampCancelAlertShown({
        address: order.from,
        chainId: order.chainId,
        id: order.id,
        nowMs: NOW + CANCEL_TX_TIMEOUT_MS + 60_000,
      }),
    )
    const stampedOrder = nextState[order.from]?.[order.chainId]?.[order.id] as UniswapXOrderDetails
    expect(stampedOrder).not.toBe(order)

    rerender(<TransactionTypeCell transaction={stampedOrder} />)
    expect(screen.getByText(WARNING_TEXT)).toBeInTheDocument()
  })
})
