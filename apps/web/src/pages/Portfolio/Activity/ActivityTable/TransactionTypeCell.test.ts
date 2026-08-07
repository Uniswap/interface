import { ArrowDownToLine } from 'ui/src/components/icons/ArrowDownToLine'
import { ArrowUpToLine } from 'ui/src/components/icons/ArrowUpToLine'
import { Receipt } from 'ui/src/components/icons/Receipt'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  getTransactionTypeCellIconProps,
  shouldShowCancelTimeoutWarning,
} from '~/pages/Portfolio/Activity/ActivityTable/TransactionTypeCell'
import { createMockUniswapXOrder } from '~/test-utils/transactions/fixtures'

describe('getTransactionTypeCellIconProps', () => {
  it('uses the earn icon for deposits and vault withdrawals instead of using group icons', () => {
    expect(
      getTransactionTypeCellIconProps({ transactionType: TransactionType.Deposit, groupIcon: SendAction }),
    ).toEqual({
      IconComponent: ArrowDownToLine,
    })
    expect(
      getTransactionTypeCellIconProps({
        transactionType: TransactionType.Withdraw,
        groupIcon: SendAction,
        isVaultWithdraw: true,
      }),
    ).toEqual({
      IconComponent: ArrowUpToLine,
    })
  })

  it('preserves the group icon for non-vault withdrawals', () => {
    expect(
      getTransactionTypeCellIconProps({ transactionType: TransactionType.Withdraw, groupIcon: SendAction }),
    ).toEqual({
      IconComponent: SendAction,
    })
  })

  it('falls back to the group icon or receipt icon for other transaction types', () => {
    expect(getTransactionTypeCellIconProps({ transactionType: TransactionType.Send, groupIcon: SendAction })).toEqual({
      IconComponent: SendAction,
    })
    expect(getTransactionTypeCellIconProps({ transactionType: TransactionType.Unknown, groupIcon: null })).toEqual({
      IconComponent: Receipt,
    })
  })
})

describe('shouldShowCancelTimeoutWarning', () => {
  const nowMs = 1_700_000_000_000
  const timedOutOrder = createMockUniswapXOrder({
    status: TransactionStatus.Cancelling,
    cancelTxHash: '0xcancel',
    cancelTimeoutAtMs: nowMs - 1,
  })

  it('shows the warning treatment for a timed-out cancellation when the flag is on', () => {
    expect(shouldShowCancelTimeoutWarning({ transaction: timedOutOrder, isCancelTimeoutEnabled: true, nowMs })).toBe(
      true,
    )
  })

  it('never shows the warning with the flag off, before the deadline, or once the cancel tx mined', () => {
    expect(shouldShowCancelTimeoutWarning({ transaction: timedOutOrder, isCancelTimeoutEnabled: false, nowMs })).toBe(
      false,
    )
    expect(
      shouldShowCancelTimeoutWarning({
        transaction: createMockUniswapXOrder({
          status: TransactionStatus.Cancelling,
          cancelTxHash: '0xcancel',
          cancelTimeoutAtMs: nowMs + 60_000,
        }),
        isCancelTimeoutEnabled: true,
        nowMs,
      }),
    ).toBe(false)
    expect(
      shouldShowCancelTimeoutWarning({
        transaction: createMockUniswapXOrder({
          status: TransactionStatus.Cancelling,
          cancelTxHash: '0xcancel',
          cancelTimeoutAtMs: nowMs - 1,
          cancelTxMined: true,
        }),
        isCancelTimeoutEnabled: true,
        nowMs,
      }),
    ).toBe(false)
  })
})
