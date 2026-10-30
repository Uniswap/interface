import { describe, expect, it } from 'vitest'
import { quickLaunchMaxBidFdv } from './quickLaunchMaxBidFdv'

describe('quickLaunchMaxBidFdv', () => {
  it('is 25,000 native units on ETH-native chains', () => {
    for (const chainId of [1, 130, 8453, 42161, 4663]) {
      expect(quickLaunchMaxBidFdv(chainId)).toBe(25_000n)
    }
  })

  // Arc's native currency is USDC: 25,000 of it would be a $25k FDV.
  it('is 50,000,000 USDC on Arc', () => {
    expect(quickLaunchMaxBidFdv(5042)).toBe(50_000_000n)
  })
})
