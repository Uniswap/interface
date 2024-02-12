import { act, renderHook } from '@testing-library/react'
import ms from 'ms'

import {
  MockClosedUniswapXOrder,
  MockMint,
  MockMoonpayPurchase,
  MockNFTApproval,
  MockNFTApprovalForAll,
  MockNFTPurchase,
  MockNFTReceive,
  MockOpenUniswapXOrder,
  MockRemoveLiquidity,
  MockSenderAddress,
  MockSpamMint,
  MockSpamSwap,
  MockSwap,
  MockSwapOrder,
  MockTokenApproval,
  MockTokenReceive,
  MockTokenSend,
  mockTokenTransferInPartsFragment,
  mockTokenTransferOutPartsFragment,
  mockTransactionDetailsPartsFragment,
  MockWrap,
} from './fixtures/activity'
import {
  offchainOrderDetailsFromGraphQLTransactionActivity,
  parseRemoteActivities,
  parseSwapAmounts,
  useTimeSince,
} from './parseRemote'

const swapOrderTokenChanges = {
  TokenTransfer: [mockTokenTransferOutPartsFragment, mockTokenTransferInPartsFragment],
  NftTransfer: [],
  TokenApproval: [],
  NftApproval: [],
  NftApproveForAll: [],
}

describe('parseRemote', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  describe('parseRemoteActivities', () => {
    it('should not parse open UniswapX order', () => {
      const result = parseRemoteActivities([MockOpenUniswapXOrder], '', jest.fn())
      expect(result).toEqual({})
    })
    it('should parse closed UniswapX order', () => {
      const result = parseRemoteActivities([MockClosedUniswapXOrder], '', jest.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT approval', () => {
      const result = parseRemoteActivities([MockNFTApproval], '', jest.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT approval for all', () => {
      const result = parseRemoteActivities([MockNFTApprovalForAll], '', jest.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT Mint', () => {
      const result = parseRemoteActivities([MockMint], '', jest.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should mark spam when tx does not come from user and contains spam', () => {
      const resultFromExternal = parseRemoteActivities([MockSpamMint], '', jest.fn())
      expect(resultFromExternal?.['someHash'].isSpam).toBeTruthy()
      const resultFromUser = parseRemoteActivities([MockSpamMint], MockSenderAddress, jest.fn())
      expect(resultFromUser?.['someHash'].isSpam).toBeFalsy()
    })
    it('should parse swap', () => {
      const result = parseRemoteActivities([MockSwap], '', jest.fn().mockReturnValue('100'))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should not mark swaps for spam tokens as spam', () => {
      const result = parseRemoteActivities([MockSpamSwap], '', jest.fn().mockReturnValue('100'))
      expect(result?.['someHash'].isSpam).toBeFalsy()
    })
    it('should parse nft purchase', () => {
      const result = parseRemoteActivities([MockNFTPurchase], '', jest.fn().mockReturnValue('100'))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse token approval', () => {
      const result = parseRemoteActivities([MockTokenApproval], '', jest.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse send', () => {
      const result = parseRemoteActivities([MockTokenSend], '', jest.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse receive', () => {
      const result = parseRemoteActivities([MockTokenReceive], '', jest.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT receive', () => {
      const result = parseRemoteActivities([MockNFTReceive], '', jest.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse remove liquidity', () => {
      const result = parseRemoteActivities([MockRemoveLiquidity], '', jest.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse moonpay purchase', () => {
      const result = parseRemoteActivities([MockMoonpayPurchase], '', jest.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse swap order', () => {
      const result = parseRemoteActivities([MockSwapOrder], '', jest.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse eth wrap', () => {
      const result = parseRemoteActivities([MockWrap], '', jest.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
  })

  describe('useTimeSince', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should initialize with the correct time since', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 60 // 60 seconds ago
      const { result } = renderHook(() => useTimeSince(timestamp))

      expect(result.current).toBe('1m')
    })

    it('should update time since every second', async () => {
      const timestamp = Math.floor(Date.now() / 1000) - 50 // 50 seconds ago
      const { result, rerender } = renderHook(() => useTimeSince(timestamp))

      act(() => {
        jest.advanceTimersByTime(ms('1.1s'))
      })
      rerender()

      expect(result.current).toBe('51s')
    })

    it('should stop updating after 61 seconds', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 61 // 61 seconds ago
      const { result, rerender } = renderHook(() => useTimeSince(timestamp))

      act(() => {
        jest.advanceTimersByTime(ms('121.1s'))
      })
      rerender()

      // maxes out at 1m
      expect(result.current).toBe('1m')
    })
  })

  describe('parseSwapAmounts', () => {
    it('should correctly parse amounts when both sent and received tokens are present', () => {
      const result = parseSwapAmounts(swapOrderTokenChanges, jest.fn().mockReturnValue('100'))
      expect(result).toEqual({
        inputAmount: '100',
        inputAmountRaw: '100000000000000000000',
        inputCurrencyId: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        outputAmount: '100',
        outputAmountRaw: '100000000000000000000',
        outputCurrencyId: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        sent: mockTokenTransferOutPartsFragment,
        received: mockTokenTransferInPartsFragment,
      })
    })

    it('should return undefined when sent token is missing', () => {
      const result = parseSwapAmounts(
        {
          ...swapOrderTokenChanges,
          TokenTransfer: [mockTokenTransferOutPartsFragment],
        },
        jest.fn().mockReturnValue('100')
      )
      expect(result).toEqual(undefined)
    })
  })

  describe('offchainOrderDetailsFromGraphQLTransactionActivity', () => {
    it('should return undefined when the activity is not a swap order', () => {
      const result = offchainOrderDetailsFromGraphQLTransactionActivity(
        { ...MockSwapOrder, details: { ...mockTransactionDetailsPartsFragment, __typename: 'TransactionDetails' } },
        {
          ...swapOrderTokenChanges,
          TokenTransfer: [],
        }, // no token changes
        jest.fn().mockReturnValue('100')
      )
      expect(result).toEqual(undefined)
    })

    it('should return the OffchainOrderDetails', () => {
      const result = offchainOrderDetailsFromGraphQLTransactionActivity(
        { ...MockSwapOrder, details: { ...mockTransactionDetailsPartsFragment, __typename: 'TransactionDetails' } },
        swapOrderTokenChanges,
        jest.fn().mockReturnValue('100')
      )
      expect(result).toEqual({
        chainId: 1,
        status: 'filled',
        id: 'tx123',
        offerer: '0xSenderAddress',
        orderHash: '0xHashValue',
        swapInfo: {
          expectedOutputCurrencyAmountRaw: '100000000000000000000',
          inputCurrencyAmountRaw: '100000000000000000000',
          inputCurrencyId: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          isUniswapXOrder: true,
          minimumOutputCurrencyAmountRaw: '100000000000000000000',
          outputCurrencyId: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          settledOutputCurrencyAmountRaw: '100000000000000000000',
          tradeType: 0,
          type: 1,
        },
        txHash: '0xHashValue',
        type: 'signUniswapXOrder',
        addedTime: 10000,
      })
    })
  })
})
