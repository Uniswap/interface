import { act, renderHook } from '@testing-library/react'
import {
  MockMint,
  MockMoonpayPurchase,
  MockNFTApproval,
  MockNFTApprovalForAll,
  MockNFTPurchase,
  MockNFTReceive,
  MockRemoveLiquidity,
  MockSenderAddress,
  MockSpamMint,
  MockSpamSwap,
  MockSwap,
  MockSwapOrder,
  MockTokenApproval,
  MockTokenReceive,
  MockTokenSend,
  MockWrap,
  mockTokenTransferInPartsFragment,
  mockTokenTransferOutPartsFragment,
  mockTransactionDetailsPartsFragment,
} from 'components/AccountDrawer/MiniPortfolio/Activity/fixtures/activity'
import {
  offchainOrderDetailsFromGraphQLTransactionActivity,
  parseRemoteActivities,
  parseSwapAmounts,
  useTimeSince,
} from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import ms from 'ms'
import { MockExpiredUniswapXOrder, MockFilledUniswapXOrder, MockOpenUniswapXOrder } from 'state/signatures/fixtures'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'

const swapOrderTokenChanges = {
  TokenTransfer: [mockTokenTransferOutPartsFragment, mockTokenTransferInPartsFragment],
  NftTransfer: [],
  TokenApproval: [],
  NftApproval: [],
  NftApproveForAll: [],
}

describe('parseRemote', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  describe('parseRemoteActivities', () => {
    it('should not parse open UniswapX order', () => {
      const result = parseRemoteActivities([MockOpenUniswapXOrder], '', vi.fn())
      expect(result).toEqual({})
    })
    it('should parse expired UniswapX order', () => {
      const result = parseRemoteActivities([MockExpiredUniswapXOrder], '', vi.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse filledUniswapX order', () => {
      const result = parseRemoteActivities([MockFilledUniswapXOrder], '', vi.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT approval', () => {
      const result = parseRemoteActivities([MockNFTApproval], '', vi.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT approval for all', () => {
      const result = parseRemoteActivities([MockNFTApprovalForAll], '', vi.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT Mint', () => {
      const result = parseRemoteActivities([MockMint], '', vi.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should mark spam when tx does not come from user and contains spam', () => {
      const resultFromExternal = parseRemoteActivities([MockSpamMint], '', vi.fn())
      expect(resultFromExternal?.['someHash'].isSpam).toBeTruthy()
      const resultFromUser = parseRemoteActivities([MockSpamMint], MockSenderAddress, vi.fn())
      expect(resultFromUser?.['someHash'].isSpam).toBeFalsy()
    })
    it('should parse swap', () => {
      const result = parseRemoteActivities([MockSwap], '', vi.fn().mockReturnValue('100'))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should not mark swaps for spam tokens as spam', () => {
      const result = parseRemoteActivities([MockSpamSwap], '', vi.fn().mockReturnValue('100'))
      expect(result?.['someHash'].isSpam).toBeFalsy()
    })
    it('should parse nft purchase', () => {
      const result = parseRemoteActivities([MockNFTPurchase], '', vi.fn().mockReturnValue('100'))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse token approval', () => {
      const result = parseRemoteActivities([MockTokenApproval], '', vi.fn())
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse send', () => {
      const result = parseRemoteActivities([MockTokenSend], '', vi.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse receive', () => {
      const result = parseRemoteActivities([MockTokenReceive], '', vi.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT receive', () => {
      const result = parseRemoteActivities([MockNFTReceive], '', vi.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse remove liquidity', () => {
      const result = parseRemoteActivities([MockRemoveLiquidity], '', vi.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse moonpay purchase', () => {
      const result = parseRemoteActivities([MockMoonpayPurchase], '', vi.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse swap order', () => {
      const result = parseRemoteActivities([MockSwapOrder], '', vi.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse eth wrap', () => {
      const result = parseRemoteActivities([MockWrap], '', vi.fn().mockReturnValue(100))
      expect(result?.['someHash']).toMatchSnapshot()
    })
  })

  describe('useTimeSince', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should initialize with the correct time since', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 65 // 65 seconds ago
      const { result } = renderHook(() => useTimeSince(timestamp))

      expect(result.current).toBe('1m')
    })

    it('should update time since every second', async () => {
      const timestamp = Math.floor(Date.now() / 1000) - 50 // 50 seconds ago
      const { result, rerender } = renderHook(() => useTimeSince(timestamp))

      act(() => {
        vi.advanceTimersByTime(ms('1.1s'))
      })
      rerender()

      expect(result.current).toBe('51s')
    })

    it('should stop updating after 61 seconds', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 61 // 61 seconds ago
      const { result, rerender } = renderHook(() => useTimeSince(timestamp))

      act(() => {
        vi.advanceTimersByTime(ms('121.1s'))
      })
      rerender()

      // maxes out at 1m
      expect(result.current).toBe('1m')
    })
  })

  describe('parseSwapAmounts', () => {
    it('should correctly parse amounts when both sent and received tokens are present', () => {
      const result = parseSwapAmounts(swapOrderTokenChanges, vi.fn().mockReturnValue('100'))
      expect(result).toEqual({
        inputAmount: '100',
        inputAmountRaw: '100000000000000000000',
        inputCurrencyAddress: DAI.address,
        outputAmount: '100',
        outputAmountRaw: '100000000000000000000',
        outputCurrencyAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
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
        vi.fn().mockReturnValue('100'),
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
        vi.fn().mockReturnValue('100'),
      )
      expect(result).toEqual(undefined)
    })

    it('should return the OffchainOrderDetails', () => {
      const result = offchainOrderDetailsFromGraphQLTransactionActivity(
        { ...MockSwapOrder, details: { ...mockTransactionDetailsPartsFragment, __typename: 'TransactionDetails' } },
        swapOrderTokenChanges,
        vi.fn().mockReturnValue('100'),
      )
      expect(result).toEqual({
        chainId: UniverseChainId.Mainnet,
        status: 'filled',
        id: 'tx123',
        offerer: '0xSenderAddress',
        orderHash: '0xHashValue',
        swapInfo: {
          expectedOutputCurrencyAmountRaw: '100000000000000000000',
          inputCurrencyAmountRaw: '100000000000000000000',
          inputCurrencyId: currencyId(DAI),
          isUniswapXOrder: true,
          minimumOutputCurrencyAmountRaw: '100000000000000000000',
          outputCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
          settledOutputCurrencyAmountRaw: '100000000000000000000',
          tradeType: 0,
          type: TransactionType.Swap,
        },
        txHash: '0xHashValue',
        addedTime: 10000,
      })
    })
  })
})
