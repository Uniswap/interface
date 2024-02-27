import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks' // Replace with the actual import if this is incorrect

import { Activity } from './types'
import { createGroups } from './utils'

describe('createGroups', () => {
  it('should return an empty array if activities is undefined', () => {
    expect(createGroups(undefined)).toEqual([])
  })

  it('should return an empty array if activities is empty', () => {
    expect(createGroups([])).toEqual([])
  })

  it('should hide spam if requested', () => {
    const mockActivities = [
      { timestamp: Date.now() / 1000 - 300, status: TransactionStatus.Confirmed, isSpam: true },
    ] as Activity[]

    expect(createGroups(mockActivities, false)).toContainEqual(
      expect.objectContaining({
        title: 'Today',
        transactions: expect.arrayContaining([
          expect.objectContaining({ timestamp: expect.any(Number), status: TransactionStatus.Confirmed }),
        ]),
      })
    )
    expect(createGroups(mockActivities, true)).toEqual([])
  })

  it('should sort and group activities based on status and time', () => {
    const mockActivities = [
      { timestamp: 1700000000, status: TransactionStatus.Pending },
      { timestamp: 1650000000, status: TransactionStatus.Confirmed },
      { timestamp: Date.now() / 1000 - 300, status: TransactionStatus.Confirmed },
    ] as Activity[]

    const result = createGroups(mockActivities)

    expect(result).toContainEqual(
      expect.objectContaining({
        title: 'Pending',
        transactions: expect.arrayContaining([
          expect.objectContaining({ timestamp: 1700000000, status: TransactionStatus.Pending }),
        ]),
      })
    )

    expect(result).toContainEqual(
      expect.objectContaining({
        title: 'Today',
        transactions: expect.arrayContaining([
          expect.objectContaining({ timestamp: expect.any(Number), status: TransactionStatus.Confirmed }),
        ]),
      })
    )
  })
})
