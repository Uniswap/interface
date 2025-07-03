import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { createGroups } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

const nowTimestampMs = 1749832099000

describe('createGroups', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(nowTimestampMs)
  })

  afterEach(() => {
    // Restore the original Date.now() implementation after each test
    vi.restoreAllMocks()
  })

  it('should return an empty array if activities is undefined', () => {
    expect(createGroups(undefined)).toEqual([])
  })

  it('should return an empty array if activities is empty', () => {
    expect(createGroups([])).toEqual([])
  })

  it('should hide spam if requested', () => {
    const mockActivities = [
      { timestamp: Math.floor(nowTimestampMs / 1000) - 300, status: TransactionStatus.Success, isSpam: true },
    ] as Activity[]

    expect(createGroups(mockActivities, false)).toContainEqual(
      expect.objectContaining({
        title: 'Today',
        transactions: expect.arrayContaining([
          expect.objectContaining({ timestamp: expect.any(Number), status: TransactionStatus.Success }),
        ]),
      }),
    )
    expect(createGroups(mockActivities, true)).toEqual([])
  })

  it('should sort and group activities based on status and time', () => {
    const mockActivities = [
      { timestamp: 1700000000, status: TransactionStatus.Pending },
      { timestamp: 1650000000, status: TransactionStatus.Success },
      { timestamp: Math.floor(nowTimestampMs / 1000) - 300, status: TransactionStatus.Success },
    ] as Activity[]

    const result = createGroups(mockActivities)

    expect(result).toContainEqual(
      expect.objectContaining({
        title: 'Pending',
        transactions: expect.arrayContaining([
          expect.objectContaining({ timestamp: 1700000000, status: TransactionStatus.Pending }),
        ]),
      }),
    )

    expect(result).toContainEqual(
      expect.objectContaining({
        title: 'Today',
        transactions: expect.arrayContaining([
          expect.objectContaining({ timestamp: expect.any(Number), status: TransactionStatus.Success }),
        ]),
      }),
    )
  })
})
