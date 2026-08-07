import { TradingApi } from '@universe/api'
import {
  CANCEL_TX_TIMEOUT_MS,
  CancelEvaluation,
  evaluateCancelState,
  isCancelTimedOut,
  isOrphanCancel,
  ORPHAN_CANCEL_TIMEOUT_MS,
} from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { uniswapXOrderDetails } from 'uniswap/src/test/fixtures'

const NOW = 1_700_000_000_000
const CANCEL_TX_HASH = '0xcanceltxhash'

function cancellingOrder(overrides: Partial<UniswapXOrderDetails> = {}): UniswapXOrderDetails {
  return {
    ...uniswapXOrderDetails({ status: TransactionStatus.Cancelling }),
    // Future expiry (unix seconds) unless overridden
    expiry: Math.floor(NOW / 1000) + 3600,
    cancelTxHash: CANCEL_TX_HASH,
    cancelBroadcastTimeMs: NOW - CANCEL_TX_TIMEOUT_MS - 1000,
    cancelTimeoutAtMs: NOW - 1000,
    ...overrides,
  }
}

describe(evaluateCancelState, () => {
  describe('the 6-arm backend branch (deadline passed, no receipt found)', () => {
    const cases: Array<[TradingApi.OrderStatus, CancelEvaluation['kind']]> = [
      [TradingApi.OrderStatus.OPEN, 'timeout-alert'],
      [TradingApi.OrderStatus.INSUFFICIENT_FUNDS, 'timeout-alert'],
      [TradingApi.OrderStatus.CANCELLED, 'order-cancelled'],
      [TradingApi.OrderStatus.FILLED, 'order-filled'],
      [TradingApi.OrderStatus.EXPIRED, 'order-expired'],
      [TradingApi.OrderStatus.ERROR, 'order-errored'],
    ]

    it.each(cases)('backend %s → %s', (backendStatus, expectedKind) => {
      const result = evaluateCancelState({
        order: cancellingOrder(),
        freshBackendStatus: backendStatus,
        cancelTxReceiptStatus: 'not-found',
        nowMs: NOW,
      })
      expect(result.kind).toBe(expectedKind)
    })

    it('backend UNVERIFIED → none', () => {
      const result = evaluateCancelState({
        order: cancellingOrder(),
        freshBackendStatus: TradingApi.OrderStatus.UNVERIFIED,
        cancelTxReceiptStatus: 'not-found',
        nowMs: NOW,
      })
      expect(result.kind).toBe('none')
    })
  })

  it('deadline not passed → none', () => {
    const result = evaluateCancelState({
      order: cancellingOrder({ cancelTimeoutAtMs: NOW + 60_000 }),
      freshBackendStatus: TradingApi.OrderStatus.OPEN,
      nowMs: NOW,
    })
    expect(result.kind).toBe('none')
  })

  it('non-Cancelling order → none (Dutch/Priority orders without cancel fields can never mis-fire)', () => {
    const result = evaluateCancelState({
      order: cancellingOrder({ status: TransactionStatus.Pending }),
      freshBackendStatus: TradingApi.OrderStatus.OPEN,
      nowMs: NOW,
    })
    expect(result.kind).toBe('none')
  })

  describe('receipt-first at deadline', () => {
    it('asks for the receipt before branching when a hash exists', () => {
      const result = evaluateCancelState({
        order: cancellingOrder(),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        nowMs: NOW,
      })
      expect(result).toEqual({ kind: 'check-receipt', cancelTxHash: CANCEL_TX_HASH })
    })

    it('receipt found → cancel-tx-mined, never a terminal order flip', () => {
      const result = evaluateCancelState({
        order: cancellingOrder(),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        cancelTxReceiptStatus: 'mined',
        nowMs: NOW,
      })
      expect(result.kind).toBe('cancel-tx-mined')
    })

    it('cancelTxMined already set → none (finalizing state, backend adjudicates)', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({ cancelTxMined: true }),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        nowMs: NOW,
      })
      expect(result.kind).toBe('none')
    })
  })

  describe('expiry gating of the alert', () => {
    it('expiry === undefined ⇒ treated as NOT expired — alert allowed (legacy stuck records)', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({ expiry: undefined }),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        cancelTxReceiptStatus: 'not-found',
        nowMs: NOW,
      })
      expect(result.kind).toBe('timeout-alert')
    })

    it('expired order never alerts', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({ expiry: Math.floor(NOW / 1000) - 60 }),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        cancelTxReceiptStatus: 'not-found',
        nowMs: NOW,
      })
      expect(result.kind).toBe('none')
    })

    it('falls back to the backend deadline when the local record has no expiry', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({ expiry: undefined }),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        cancelTxReceiptStatus: 'not-found',
        nowMs: NOW,
        backendDeadline: Math.floor(NOW / 1000) - 60,
      })
      expect(result.kind).toBe('none')
    })
  })

  describe('orphan / legacy records', () => {
    it('Cancelling with no hash and no deadline → stamp-orphan-timeout (never immediately timed out)', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({
          cancelTxHash: undefined,
          cancelBroadcastTimeMs: undefined,
          cancelTimeoutAtMs: undefined,
        }),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        nowMs: NOW,
      })
      expect(result.kind).toBe('stamp-orphan-timeout')
    })

    it('stamped orphan before the 5-min deadline → none', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({
          cancelTxHash: undefined,
          cancelBroadcastTimeMs: undefined,
          cancelInitiatedTimeMs: NOW - 4 * 60 * 1000,
          cancelTimeoutAtMs: NOW - 4 * 60 * 1000 + ORPHAN_CANCEL_TIMEOUT_MS,
        }),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        nowMs: NOW,
      })
      expect(result.kind).toBe('none')
    })

    it('stamped orphan past the 5-min deadline + backend OPEN → alert without a receipt check', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({
          cancelTxHash: undefined,
          cancelBroadcastTimeMs: undefined,
          cancelRequest: undefined,
          cancelInitiatedTimeMs: NOW - ORPHAN_CANCEL_TIMEOUT_MS - 1000,
          cancelTimeoutAtMs: NOW - 1000,
        }),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        nowMs: NOW,
      })
      expect(result).toEqual({ kind: 'timeout-alert', cause: 'legacy-record' })
    })

    it('orphan with a cancelRequest (new flow, wallet never returned a hash) → orphan-no-hash cause', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({
          cancelTxHash: undefined,
          cancelBroadcastTimeMs: undefined,
          cancelRequest: { to: '0xpermit2' },
          cancelInitiatedTimeMs: NOW - ORPHAN_CANCEL_TIMEOUT_MS - 1000,
          cancelTimeoutAtMs: NOW - 1000,
        }),
        freshBackendStatus: TradingApi.OrderStatus.OPEN,
        nowMs: NOW,
      })
      expect(result).toEqual({ kind: 'timeout-alert', cause: 'orphan-no-hash' })
    })

    it('stamped orphan whose backend status resolves CANCELLED → auto-resolves as order-cancelled', () => {
      const result = evaluateCancelState({
        order: cancellingOrder({
          cancelTxHash: undefined,
          cancelBroadcastTimeMs: undefined,
          cancelTimeoutAtMs: NOW - 1000,
        }),
        freshBackendStatus: TradingApi.OrderStatus.CANCELLED,
        nowMs: NOW,
      })
      expect(result.kind).toBe('order-cancelled')
    })
  })

  it('rehydrated record with a past deadline evaluates immediately (deadline lives in the record, not a timer)', () => {
    const result = evaluateCancelState({
      order: cancellingOrder({ cancelTimeoutAtMs: NOW - 10 * 60 * 1000 }),
      freshBackendStatus: TradingApi.OrderStatus.OPEN,
      cancelTxReceiptStatus: 'not-found',
      nowMs: NOW,
    })
    expect(result).toEqual({ kind: 'timeout-alert', cause: 'no-receipt' })
  })
})

describe(isCancelTimedOut, () => {
  it.each([
    ['timed out', cancellingOrder(), true],
    ['deadline not passed', cancellingOrder({ cancelTimeoutAtMs: NOW + 1 }), false],
    ['no deadline', cancellingOrder({ cancelTimeoutAtMs: undefined }), false],
    ['cancel tx mined', cancellingOrder({ cancelTxMined: true }), false],
    ['not cancelling', cancellingOrder({ status: TransactionStatus.Pending }), false],
  ] as const)('%s', (_name, order, expected) => {
    expect(isCancelTimedOut(order, NOW)).toBe(expected)
  })
})

describe(isOrphanCancel, () => {
  it('is a state predicate keyed on Cancelling + missing hash only', () => {
    expect(isOrphanCancel(cancellingOrder({ cancelTxHash: undefined }))).toBe(true)
    expect(isOrphanCancel(cancellingOrder())).toBe(false)
    expect(isOrphanCancel(cancellingOrder({ status: TransactionStatus.Pending, cancelTxHash: undefined }))).toBe(false)
  })
})
