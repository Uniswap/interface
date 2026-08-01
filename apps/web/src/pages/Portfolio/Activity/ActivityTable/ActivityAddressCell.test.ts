import { EarnAction } from '@universe/api/src/clients/trading/__generated__/models/EarnAction'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getEarnActivityAddressDirection } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAddressCell'

function createTransaction(typeInfo: TransactionDetails['typeInfo']): TransactionDetails {
  return { typeInfo } as TransactionDetails
}

describe('getEarnActivityAddressDirection', () => {
  it('uses To for vault deposits and From for vault withdrawals', () => {
    expect(
      getEarnActivityAddressDirection(
        createTransaction({
          type: TransactionType.Deposit,
          isVault: true,
        } as TransactionDetails['typeInfo']),
      ),
    ).toBe('to')

    expect(
      getEarnActivityAddressDirection(
        createTransaction({
          type: TransactionType.Withdraw,
          isVault: true,
        } as TransactionDetails['typeInfo']),
      ),
    ).toBe('from')
  })

  it('does not override non-vault activity', () => {
    expect(
      getEarnActivityAddressDirection(
        createTransaction({
          type: TransactionType.Withdraw,
        } as TransactionDetails['typeInfo']),
      ),
    ).toBeUndefined()

    expect(
      getEarnActivityAddressDirection(
        createTransaction({
          type: TransactionType.Send,
        } as TransactionDetails['typeInfo']),
      ),
    ).toBeUndefined()
  })

  it('uses To/From for Earn plan rows', () => {
    expect(
      getEarnActivityAddressDirection(
        createTransaction({
          type: TransactionType.Plan,
          earnAction: EarnAction.DEPOSIT,
        } as TransactionDetails['typeInfo']),
      ),
    ).toBe('to')

    expect(
      getEarnActivityAddressDirection(
        createTransaction({
          type: TransactionType.Plan,
          earnAction: EarnAction.WITHDRAW,
        } as TransactionDetails['typeInfo']),
      ),
    ).toBe('from')
  })

  it('does not use Earn address labels when Earn activity display is disabled', () => {
    expect(
      getEarnActivityAddressDirection(
        createTransaction({
          type: TransactionType.Deposit,
          isVault: true,
        } as TransactionDetails['typeInfo']),
        { isEarnActivityDisplayEnabled: false },
      ),
    ).toBeUndefined()

    expect(
      getEarnActivityAddressDirection(
        createTransaction({
          type: TransactionType.Plan,
          earnAction: EarnAction.DEPOSIT,
        } as TransactionDetails['typeInfo']),
        { isEarnActivityDisplayEnabled: false },
      ),
    ).toBeUndefined()
  })
})
