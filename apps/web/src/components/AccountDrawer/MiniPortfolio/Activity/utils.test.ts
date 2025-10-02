import { BigNumber } from '@ethersproject/bignumber'
import { GraphQLApi } from '@universe/api'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import {
  createActivityMapByHash,
  createGroups,
  getActivityNonce,
  getCurrencyAddress,
  haveSameNonce,
  parseTokenAmount,
} from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { DEFAULT_ERC20_DECIMALS } from 'utilities/src/tokens/constants'
import { vi } from 'vitest'

const nowTimestampMs = 1749832099000

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

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

  it('should return undefined if nonce is null', () => {
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
          // @ts-ignore
          nonce: null,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    expect(getActivityNonce(activity)).toEqual(undefined)
  })

  it('should return if nonce is 0', () => {
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
          nonce: 0,
          to: '0xdef',
          from: '0xabc',
        },
      },
    }
    expect(getActivityNonce(activity)).toEqual(BigNumber.from(0))
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

describe('activityMapping utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createActivityMapByHash', () => {
    it('should create a map keyed by hash', () => {
      const activities: Activity[] = [
        {
          id: 'id-1',
          hash: '0xhash1',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 1000,
          from: '0x123',
          title: 'Activity 1',
        },
        {
          id: 'id-2',
          hash: '0xhash2',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Pending,
          timestamp: 2000,
          from: '0x123',
          title: 'Activity 2',
        },
      ]

      const map = createActivityMapByHash(activities)

      expect(Object.keys(map)).toHaveLength(2)
      expect(map['0xhash1']).toBeDefined()
      expect(map['0xhash1']?.id).toBe('id-1')
      expect(map['0xhash2']).toBeDefined()
      expect(map['0xhash2']?.id).toBe('id-2')
    })

    it('should handle undefined activities in the array', () => {
      const activities: (Activity | undefined)[] = [
        {
          id: 'id-1',
          hash: '0xhash1',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 1000,
          from: '0x123',
          title: 'Activity 1',
        },
        undefined,
        {
          id: 'id-2',
          hash: '0xhash2',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Pending,
          timestamp: 2000,
          from: '0x123',
          title: 'Activity 2',
        },
      ]

      const map = createActivityMapByHash(activities)

      expect(Object.keys(map)).toHaveLength(2)
      expect(map['0xhash1']).toBeDefined()
      expect(map['0xhash2']).toBeDefined()
    })

    it('should handle empty array', () => {
      const map = createActivityMapByHash([])
      expect(Object.keys(map)).toHaveLength(0)
    })

    it('should handle fiat on-ramp activities that set hash = id', () => {
      const activities: Activity[] = [
        {
          id: 'fiat-onramp-id-123',
          hash: 'fiat-onramp-id-123', // Fiat on-ramp sets hash = id
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 1000,
          from: '0x123',
          title: 'Purchased on MoonPay',
        },
        {
          id: 'fiat-offramp-id-456',
          hash: 'fiat-offramp-id-456', // Fiat off-ramp sets hash = id
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 2000,
          from: '0x123',
          title: 'Sold on Coinbase',
        },
      ]

      const map = createActivityMapByHash(activities)

      expect(Object.keys(map)).toHaveLength(2)
      expect(map['fiat-onramp-id-123']).toBeDefined()
      expect(map['fiat-onramp-id-123']?.title).toBe('Purchased on MoonPay')
      expect(map['fiat-offramp-id-456']).toBeDefined()
      expect(map['fiat-offramp-id-456']?.title).toBe('Sold on Coinbase')
    })

    it('should overwrite duplicate hashes with the last activity', () => {
      const activities: Activity[] = [
        {
          id: 'id-1',
          hash: '0xduplicatehash',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Pending,
          timestamp: 1000,
          from: '0x123',
          title: 'First activity',
        },
        {
          id: 'id-2',
          hash: '0xduplicatehash',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 2000,
          from: '0x123',
          title: 'Second activity',
        },
      ]

      const map = createActivityMapByHash(activities)

      expect(Object.keys(map)).toHaveLength(1)
      expect(map['0xduplicatehash']?.id).toBe('id-2')
      expect(map['0xduplicatehash']?.status).toBe(TransactionStatus.Success)
    })
  })
})

describe('getCurrencyAddress', () => {
  it('should return token address when available', () => {
    const token = {
      id: 'token-id',
      address: '0x1234567890123456789012345678901234567890',
      chain: GraphQLApi.Chain.Ethereum,
      symbol: 'TEST',
      decimals: 18,
      standard: GraphQLApi.TokenStandard.Erc20,
    } as any

    const result = getCurrencyAddress(token, UniverseChainId.Mainnet)
    expect(result).toBe('0x1234567890123456789012345678901234567890')
  })

  it('should return native address when token address is null', () => {
    const token = {
      id: 'token-id',
      address: null,
      chain: GraphQLApi.Chain.Ethereum,
      symbol: 'ETH',
      decimals: 18,
      standard: GraphQLApi.TokenStandard.Native,
    } as any

    const result = getCurrencyAddress(token, UniverseChainId.Mainnet)
    // getNativeAddress for mainnet returns the NATIVE_ADDRESS constant
    expect(result).toBeTruthy()
    expect(result).not.toBe('')
  })

  it('should return native address when token address is undefined', () => {
    const token = {
      id: 'token-id',
      address: undefined,
      chain: GraphQLApi.Chain.Ethereum,
      symbol: 'ETH',
      decimals: 18,
      standard: GraphQLApi.TokenStandard.Native,
    } as any

    const result = getCurrencyAddress(token, UniverseChainId.Mainnet)
    expect(result).toBeTruthy()
    expect(result).not.toBe('')
  })
})

describe('parseTokenAmount', () => {
  it('should parse amount with provided decimals', () => {
    const result = parseTokenAmount('1000', 6)
    // parseUnits('1000', 6) should return BigNumber equivalent to 1000 * 10^6
    expect(result).toBe('1000000000')
  })

  it('should use DEFAULT_ERC20_DECIMALS when decimals is null', () => {
    const result = parseTokenAmount('1', null)
    // parseUnits('1', 18) should return BigNumber equivalent to 1 * 10^18
    expect(result).toBe('1000000000000000000')
    expect(DEFAULT_ERC20_DECIMALS).toBe(18)
  })

  it('should use DEFAULT_ERC20_DECIMALS when decimals is undefined', () => {
    const result = parseTokenAmount('1', undefined)
    // parseUnits('1', 18) should return BigNumber equivalent to 1 * 10^18
    expect(result).toBe('1000000000000000000')
  })

  it('should handle zero decimals', () => {
    const result = parseTokenAmount('100', 0)
    // parseUnits('100', 0) should return BigNumber equivalent to 100
    expect(result).toBe('100')
  })

  it('should handle decimal values in quantity', () => {
    const result = parseTokenAmount('1.5', 6)
    // parseUnits('1.5', 6) should return BigNumber equivalent to 1.5 * 10^6
    expect(result).toBe('1500000')
  })
})
