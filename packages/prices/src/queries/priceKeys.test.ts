import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { describe, expect, it } from 'vitest'

describe('priceKeys', () => {
  describe('all', () => {
    it('returns array with TokenPrice cache key', () => {
      expect(priceKeys.all).toEqual([ReactQueryCacheKey.TokenPrice])
    })
  })

  describe('token', () => {
    it('returns key with chainId and lowercased address', () => {
      const key = priceKeys.token(1, '0xABC')
      expect(key).toEqual([ReactQueryCacheKey.TokenPrice, 1, '0xabc'])
    })

    it('handles already lowercased address', () => {
      const key = priceKeys.token(42161, '0xdef')
      expect(key).toEqual([ReactQueryCacheKey.TokenPrice, 42161, '0xdef'])
    })
  })
})
