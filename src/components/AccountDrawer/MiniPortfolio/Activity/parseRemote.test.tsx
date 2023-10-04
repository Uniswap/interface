import { act, renderHook } from '@testing-library/react'
import ms from 'ms'

import {
  MockClosedUniswapXOrder,
  MockMoonpayPurchase,
  MockNFTApproval,
  MockNFTApprovalForAll,
  MockNFTPurchase,
  MockNFTReceive,
  MockNFTTransfer,
  MockOpenUniswapXOrder,
  MockRemoveLiquidity,
  MockSwapOrder,
  MockTokenApproval,
  MockTokenReceive,
  MockTokenSend,
  MockTokenTransfer,
  MockWrap,
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
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT approval', () => {
      const result = parseRemoteActivities(jest.fn(), [MockNFTApproval])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT approval for all', () => {
      const result = parseRemoteActivities(jest.fn(), [MockNFTApprovalForAll])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT transfer', () => {
      const result = parseRemoteActivities(jest.fn(), [MockNFTTransfer])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse swap', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue('100'), [MockTokenTransfer])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse nft purchase', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue('100'), [MockNFTPurchase])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse token approval', () => {
      const result = parseRemoteActivities(jest.fn(), [MockTokenApproval])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse send', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue(100), [MockTokenSend])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse receive', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue(100), [MockTokenReceive])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse NFT receive', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue(100), [MockNFTReceive])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse remove liquidity', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue(100), [MockRemoveLiquidity])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse moonpay purchase', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue('100'), [MockMoonpayPurchase])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse swap order', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue('100'), [MockSwapOrder])
      expect(result?.['someHash']).toMatchSnapshot()
    })
    it('should parse eth wrap', () => {
      const result = parseRemoteActivities(jest.fn().mockReturnValue('100'), [MockWrap])
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
})
