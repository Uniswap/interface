import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { describe, expect, it } from 'vitest'
import { isFeeTierPoolUnavailable } from '~/features/Liquidity/hooks/useV4PoolsInitializedOnChain'

const RESERVED_INITIALIZER = '0x824A3eCDe463DD45cC156b64CEfA132596C9A000'

describe('isFeeTierPoolUnavailable', () => {
  it('is available when the pool is neither initialized nor reserved', () => {
    expect(isFeeTierPoolUnavailable({ sqrtPriceX96: 0n, reservedBy: ZERO_ADDRESS })).toBe(false)
  })

  it('is unavailable when the pool is already initialized', () => {
    expect(isFeeTierPoolUnavailable({ sqrtPriceX96: 79228162514264337593543950336n, reservedBy: ZERO_ADDRESS })).toBe(
      true,
    )
  })

  it('is unavailable when the pool id is reserved by a live auction (the gap a slot0-only check misses)', () => {
    expect(isFeeTierPoolUnavailable({ sqrtPriceX96: 0n, reservedBy: RESERVED_INITIALIZER })).toBe(true)
  })

  it('treats missing reads as not-unavailable (reservation not checked on chains without a launcher)', () => {
    expect(isFeeTierPoolUnavailable({ sqrtPriceX96: 0n, reservedBy: undefined })).toBe(false)
    expect(isFeeTierPoolUnavailable({})).toBe(false)
  })

  it('still flags an initialized pool even when the reservation read is absent', () => {
    expect(isFeeTierPoolUnavailable({ sqrtPriceX96: 123n })).toBe(true)
  })
})
