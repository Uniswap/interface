import { isDustReceive } from 'uniswap/src/features/activity/utils/isDustReceive'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

function buildTransaction(typeInfo: { type: TransactionType; transactedUSDValue?: number }): TransactionDetails {
  return { typeInfo } as TransactionDetails
}

describe(isDustReceive, () => {
  it('flags receives below $0.005', () => {
    const type = TransactionType.Receive
    expect(isDustReceive(buildTransaction({ type, transactedUSDValue: 0.0009 }))).toBe(true)
    expect(isDustReceive(buildTransaction({ type, transactedUSDValue: 0 }))).toBe(true)
    expect(isDustReceive(buildTransaction({ type, transactedUSDValue: 0.005 }))).toBe(false)
    expect(isDustReceive(buildTransaction({ type, transactedUSDValue: 0.01 }))).toBe(false)
  })

  it('does not flag receives with no known USD value', () => {
    expect(isDustReceive(buildTransaction({ type: TransactionType.Receive }))).toBe(false)
  })

  it.each([TransactionType.Send, TransactionType.Swap])('does not flag %s transactions', (type) => {
    expect(isDustReceive(buildTransaction({ type, transactedUSDValue: 0.00001 }))).toBe(false)
  })
})
