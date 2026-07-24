import { ArrowDownToLine } from 'ui/src/components/icons/ArrowDownToLine'
import { ArrowUpToLine } from 'ui/src/components/icons/ArrowUpToLine'
import { Receipt } from 'ui/src/components/icons/Receipt'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getTransactionTypeCellIconProps } from '~/pages/Portfolio/Activity/ActivityTable/TransactionTypeCell'

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
