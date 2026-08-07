import 'utilities/src/logger/mocks'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  getActivityTitle,
  getCancelledTransactionTitleTable,
  getLimitOrderTextTable,
  getOrderTextTable,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/constants'

// Tripwire: every TransactionType must have a non-empty title for every web-displayable status.
// A new enum member (e.g. UniswapXCancel) without table entries renders blank rows/popups.
describe('activity title tables', () => {
  const webStatuses = [TransactionStatus.Pending, TransactionStatus.Success, TransactionStatus.Failed] as const

  it.each(Object.values(TransactionType))('getActivityTitle returns a non-empty title for %s', (type) => {
    for (const status of webStatuses) {
      expect(getActivityTitle({ type, status })).toBeTruthy()
      expect(getActivityTitle({ type, status, alternate: true })).toBeTruthy()
    }
  })

  it.each(Object.values(TransactionType))(
    'getCancelledTransactionTitleTable returns a non-empty title for %s',
    (type) => {
      expect(getCancelledTransactionTitleTable()[type]).toBeTruthy()
    },
  )

  it.each([
    ['getOrderTextTable', getOrderTextTable],
    ['getLimitOrderTextTable', getLimitOrderTextTable],
  ] as const)('%s has non-empty titles for every entry, including FailedCancel', (_name, getTable) => {
    const table = getTable()
    expect(table[TransactionStatus.FailedCancel]).toBeDefined()
    expect(table[TransactionStatus.Cancelling]).toBeDefined()
    for (const entry of Object.values(table)) {
      expect(entry.getTitle()).toBeTruthy()
      expect(entry.getStatusMessage?.()).not.toBe('')
    }
  })
})
