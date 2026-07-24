import { TradingApi } from '@universe/api'
import {
  getEarnPlanInterruptedTitleKey,
  getEarnPlanStatusTitleKeyFromTransactionStatus,
  getEarnPlanTransactionType,
} from 'uniswap/src/features/earn/planActivityTitles'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

describe('planActivityTitles', () => {
  it('uses Earn deposit/withdraw titles for interrupted plans', () => {
    expect(getEarnPlanInterruptedTitleKey(TradingApi.EarnAction.DEPOSIT)).toBe('transaction.status.deposit.interrupted')
    expect(getEarnPlanInterruptedTitleKey(TradingApi.EarnAction.WITHDRAW)).toBe(
      'transaction.status.withdraw.interrupted',
    )
  })

  it('maps Earn actions to display transaction types', () => {
    expect(getEarnPlanTransactionType(TradingApi.EarnAction.DEPOSIT)).toBe(TransactionType.Deposit)
    expect(getEarnPlanTransactionType(TradingApi.EarnAction.WITHDRAW)).toBe(TransactionType.Withdraw)
  })

  it('maps transaction statuses to Earn title keys', () => {
    expect(
      getEarnPlanStatusTitleKeyFromTransactionStatus({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        transactionStatus: TransactionStatus.AwaitingAction,
      }),
    ).toBe('transaction.status.deposit.interrupted')

    expect(
      getEarnPlanStatusTitleKeyFromTransactionStatus({
        earnAction: TradingApi.EarnAction.WITHDRAW,
        transactionStatus: TransactionStatus.Success,
      }),
    ).toBe('transaction.status.withdraw.success')
  })

  it('maps Cancelling to canceling, not failed', () => {
    expect(
      getEarnPlanStatusTitleKeyFromTransactionStatus({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        transactionStatus: TransactionStatus.Cancelling,
      }),
    ).toBe('transaction.status.deposit.canceling')

    expect(
      getEarnPlanStatusTitleKeyFromTransactionStatus({
        earnAction: TradingApi.EarnAction.WITHDRAW,
        transactionStatus: TransactionStatus.Cancelling,
      }),
    ).toBe('transaction.status.withdraw.canceling')
  })

  it('maps statuses without a dedicated Earn title to interrupted, not failed', () => {
    expect(
      getEarnPlanStatusTitleKeyFromTransactionStatus({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        transactionStatus: TransactionStatus.Expired,
      }),
    ).toBe('transaction.status.deposit.interrupted')
  })
})
