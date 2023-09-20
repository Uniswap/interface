import { act, renderHook } from '@testing-library/react'
import ms from 'ms'

import {
  MockClosedUniswapXOrder,
  MockNFTApproval,
  MockNFTApprovalForAll,
  MockNFTTransfer,
  MockOpenUniswapXOrder,
  MockOrderTimestamp,
  MockRecipientAddress,
  MockSenderAddress,
  MockTokenApproval,
  MockTokenReceive,
  MockTokenSend,
  MockTokenTransfer,
} from './fixtures/activity'
import { parseRemoteActivities, useTimeSince } from './parseRemote'

describe('parseRemote', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  describe('parseRemoteActivities', () => {
    it('should not parse open UniswapX order', () => {
      const result = parseRemoteActivities(jest.fn(), [MockOpenUniswapXOrder])
      expect(result).toEqual({})
    })
    it('should parse closed UniswapX order', () => {
      const result = parseRemoteActivities(jest.fn(), [MockClosedUniswapXOrder])
      expect(result?.['someHash']).toEqual({
        chainId: 1,
        currencies: [
          {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            chainId: 1,
            decimals: 18,
            isNative: false,
            isToken: true,
            name: 'DAI',
            symbol: 'DAI',
          },
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            chainId: 1,
            decimals: 18,
            isNative: false,
            isToken: true,
            symbol: 'WETH',
            name: 'Wrapped Ether',
          },
        ],
        descriptor: '100 DAI for 200 WETH',
        from: 'someOfferer',
        hash: 'someHash',
        logos: ['someUrl', 'someUrl'],
        offchainOrderStatus: 'expired',
        prefixIconSrc: 'bolt.svg',
        status: 'FAILED',
        statusMessage: 'Your swap could not be fulfilled at this time. Please try again.',
        timestamp: MockOrderTimestamp,
        title: 'Swap expired',
      })
    })
    it('should parse NFT approval', () => {
      const result = parseRemoteActivities(jest.fn(), [MockNFTApproval])
      expect(result?.['someHash']).toEqual({
        chainId: 1,
        descriptor: '0xToAddress',
        from: '0xFromAddress',
        hash: 'someHash',
        logos: [],
        nonce: 12345,
        status: 'CONFIRMED',
        timestamp: 10000,
        title: 'Unknown Approval',
      })
    })
    it('should parse NFT approval for all', () => {
      const result = parseRemoteActivities(jest.fn(), [MockNFTApprovalForAll])
      expect(result?.['someHash']).toEqual({
        chainId: 1,
        descriptor: '0xToAddress',
        from: '0xFromAddress',
        hash: 'someHash',
        logos: [],
        nonce: 12345,
        status: 'CONFIRMED',
        timestamp: 10000,
        title: 'Unknown Approval',
      })
    })
    it('should parse NFT transfer', () => {
      const result = parseRemoteActivities(jest.fn(), [MockNFTTransfer])
      expect(result?.['someHash']).toEqual({
        chainId: 1,
        descriptor: '1 SomeCollectionName',
        from: '0xFromAddress',
        hash: 'someHash',
        logos: ['imageUrl'],
        nonce: 12345,
        status: 'CONFIRMED',
        timestamp: 10000,
        title: 'Minted',
      })
    })
    it('should parse swap', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue('100'), [MockTokenTransfer])
      expect(result?.['someHash']).toEqual({
        chainId: 1,
        currencies: [
          {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            chainId: 1,
            decimals: 18,
            isNative: false,
            isToken: true,
            name: 'DAI',
            symbol: 'DAI',
          },
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            chainId: 1,
            decimals: 18,
            isNative: false,
            isToken: true,
            symbol: 'WETH',
            name: 'Wrapped Ether',
          },
        ],
        descriptor: '100 DAI for 100 WETH',
        from: '0xFromAddress',
        hash: 'someHash',
        logos: ['logoUrl'],
        nonce: 12345,
        status: 'CONFIRMED',
        timestamp: 10000,
        title: 'Swapped',
      })
    })
    it('should parse token approval', () => {
      const result = parseRemoteActivities(jest.fn(), [MockTokenApproval])
      expect(result?.['someHash']).toEqual({
        chainId: 1,
        currencies: [
          {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            chainId: 1,
            decimals: 18,
            isNative: false,
            isToken: true,
            name: 'DAI',
            symbol: 'DAI',
          },
        ],
        descriptor: 'DAI',
        from: '0xFromAddress',
        hash: 'someHash',
        logos: ['logoUrl'],
        nonce: 12345,
        status: 'CONFIRMED',
        timestamp: 10000,
        title: 'Approved',
      })
    })
    it('should parse send', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue(100), [MockTokenSend])
      expect(result?.['someHash']).toEqual({
        chainId: 1,
        currencies: [
          {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            chainId: 1,
            decimals: 18,
            isNative: false,
            isToken: true,
            name: 'DAI',
            symbol: 'DAI',
          },
        ],
        descriptor: '100 DAI to ',
        otherAccount: MockRecipientAddress,
        from: '0xFromAddress',
        hash: 'someHash',
        logos: ['logoUrl'],
        nonce: 12345,
        status: 'CONFIRMED',
        timestamp: 10000,
        title: 'Sent',
      })
    })
    it('should parse receive', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue(100), [MockTokenReceive])
      expect(result?.['someHash']).toEqual({
        chainId: 1,
        currencies: [
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            chainId: 1,
            decimals: 18,
            isNative: false,
            isToken: true,
            name: 'Wrapped Ether',
            symbol: 'WETH',
          },
        ],
        descriptor: '100 WETH from ',
        otherAccount: MockSenderAddress,
        from: '0xFromAddress',
        hash: 'someHash',
        logos: ['logoUrl'],
        nonce: 12345,
        status: 'CONFIRMED',
        timestamp: 10000,
        title: 'Received',
      })
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
})
