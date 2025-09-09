import { BigNumber } from '@ethersproject/bignumber'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { createGroups, getActivityNonce, haveSameNonce } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
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

describe('Nonce storage and extraction', () => {
  it('should extract nonce from options.request', () => {
    const activity: Activity = {
      id: '0x123',
      hash: '0x123',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test',
      from: '0xabc',
      options: {
        request: {
          nonce: 5,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    expect(getActivityNonce(activity)).toEqual(BigNumber.from(5))
  })

  it('should return undefined when options is missing', () => {
    const activity: Activity = {
      id: '0x123',
      hash: '0x123',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test',
      from: '0xabc',
    }
    expect(getActivityNonce(activity)).toBeUndefined()
  })

  it('should handle BigNumber nonce values', () => {
    const activity: Activity = {
      id: '0x123',
      hash: '0x123',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test',
      from: '0xabc',
      options: {
        request: {
          nonce: BigNumber.from(10),
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    expect(getActivityNonce(activity)).toEqual(BigNumber.from(10))
  })

  it('should return false when one activity has no nonce', () => {
    const activity1: Activity = {
      id: '0x123',
      hash: '0x123',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test 1',
      from: '0xabc',
      options: {
        request: {
          nonce: 5,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    const activity2: Activity = {
      id: '0x456',
      hash: '0x456',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test 2',
      from: '0xabc',
    }
    expect(haveSameNonce(activity1, activity2)).toBe(false)
  })

  it('should return true when activities have the same nonce', () => {
    const activity1: Activity = {
      id: '0x123',
      hash: '0x123',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test 1',
      from: '0xabc',
      options: {
        request: {
          nonce: 5,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    const activity2: Activity = {
      id: '0x456',
      hash: '0x456',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test 2',
      from: '0xabc',
      options: {
        request: {
          nonce: 5,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    expect(haveSameNonce(activity1, activity2)).toBe(true)
  })

  it('should return false when activities have different nonces', () => {
    const activity1: Activity = {
      id: '0x123',
      hash: '0x123',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test 1',
      from: '0xabc',
      options: {
        request: {
          nonce: 5,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    const activity2: Activity = {
      id: '0x456',
      hash: '0x456',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test 2',
      from: '0xabc',
      options: {
        request: {
          nonce: 6,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    expect(haveSameNonce(activity1, activity2)).toBe(false)
  })

  it('should return true when activities have same nonce from different sources', () => {
    const activity1: Activity = {
      id: '0x123',
      hash: '0x123',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test 1',
      from: '0xabc',
      options: {
        request: {
          nonce: 5,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    const activity2: Activity = {
      id: '0x456',
      hash: '0x456',
      chainId: 1,
      status: TransactionStatus.Pending,
      timestamp: 1234567890,
      title: 'Test 2',
      from: '0xabc',
      options: {
        request: {
          nonce: 5,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    expect(haveSameNonce(activity1, activity2)).toBe(true)
  })
})
