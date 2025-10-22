import { doesGetPortfolioQueryMatchAddress } from 'uniswap/src/data/rest/getPortfolio'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const TEST_EVM_ADDRESS_1 = '0x1234567890123456789012345678901234567890'
const TEST_EVM_ADDRESS_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const TEST_SVM_ADDRESS_1 = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const TEST_SVM_ADDRESS_2 = 'So11111111111111111111111111111111111111112'

describe(doesGetPortfolioQueryMatchAddress, () => {
  describe('invalid query keys', () => {
    it('should return false for empty query key', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })

    it('should return false for query key with wrong cache key', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.UniqueId, { [Platform.EVM]: TEST_EVM_ADDRESS_1 }],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })

    it('should return false when accountAddressesByPlatform is undefined', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, undefined],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })

    it('should return false when accountAddressesByPlatform is null', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, null],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })

    it('should return false when accountAddressesByPlatform is not a valid object', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, 'invalid'],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })

    it('should return false when accountAddressesByPlatform is an array', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, [TEST_EVM_ADDRESS_1]],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })

    it('should return false when accountAddressesByPlatform is an empty object', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, {}],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })
  })

  describe('EVM address matching', () => {
    it('should return true when EVM address matches exactly', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, { [Platform.EVM]: TEST_EVM_ADDRESS_1 }],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(true)
    })

    it('should return true when EVM address matches with different casing', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, { [Platform.EVM]: TEST_EVM_ADDRESS_1.toLowerCase() }],
        address: TEST_EVM_ADDRESS_1.toUpperCase(),
        platform: Platform.EVM,
      })
      expect(result).toBe(true)
    })

    it('should return false when EVM address does not match', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, { [Platform.EVM]: TEST_EVM_ADDRESS_1 }],
        address: TEST_EVM_ADDRESS_2,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })

    it('should return false when platform is EVM but query only has SVM', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, { [Platform.SVM]: TEST_SVM_ADDRESS_1 }],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })
  })

  describe('SVM address matching', () => {
    it('should return true when SVM address matches exactly', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, { [Platform.SVM]: TEST_SVM_ADDRESS_1 }],
        address: TEST_SVM_ADDRESS_1,
        platform: Platform.SVM,
      })
      expect(result).toBe(true)
    })

    it('should return false when SVM address does not match', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, { [Platform.SVM]: TEST_SVM_ADDRESS_1 }],
        address: TEST_SVM_ADDRESS_2,
        platform: Platform.SVM,
      })
      expect(result).toBe(false)
    })

    it('should return false when platform is SVM but query only has EVM', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetPortfolio, { [Platform.EVM]: TEST_EVM_ADDRESS_1 }],
        address: TEST_SVM_ADDRESS_1,
        platform: Platform.SVM,
      })
      expect(result).toBe(false)
    })
  })

  describe('multi-platform queries', () => {
    it('should return true when EVM address matches in multi-platform query', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [
          ReactQueryCacheKey.GetPortfolio,
          {
            [Platform.EVM]: TEST_EVM_ADDRESS_1,
            [Platform.SVM]: TEST_SVM_ADDRESS_1,
          },
        ],
        address: TEST_EVM_ADDRESS_1,
        platform: Platform.EVM,
      })
      expect(result).toBe(true)
    })

    it('should return true when SVM address matches in multi-platform query', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [
          ReactQueryCacheKey.GetPortfolio,
          {
            [Platform.EVM]: TEST_EVM_ADDRESS_1,
            [Platform.SVM]: TEST_SVM_ADDRESS_1,
          },
        ],
        address: TEST_SVM_ADDRESS_1,
        platform: Platform.SVM,
      })
      expect(result).toBe(true)
    })

    it('should return false when neither address matches in multi-platform query', () => {
      const result = doesGetPortfolioQueryMatchAddress({
        queryKey: [
          ReactQueryCacheKey.GetPortfolio,
          {
            [Platform.EVM]: TEST_EVM_ADDRESS_1,
            [Platform.SVM]: TEST_SVM_ADDRESS_1,
          },
        ],
        address: TEST_EVM_ADDRESS_2,
        platform: Platform.EVM,
      })
      expect(result).toBe(false)
    })
  })
})
