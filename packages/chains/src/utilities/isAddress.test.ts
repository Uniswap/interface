import { describe, expect, it } from 'vitest'
import { createIsAddress } from './createIsAddress'

const ethersIsAddress = createIsAddress({ getViemEnabled: () => false })
const viemIsAddress = createIsAddress({ getViemEnabled: () => true })

describe('isAddress', () => {
  it('agree on valid checksummed addresses', () => {
    const addr = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
    expect(ethersIsAddress(addr)).toBe(true)
    expect(viemIsAddress(addr)).toBe(true)
  })

  it('agree on all-lowercase addresses', () => {
    const addr = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'
    expect(ethersIsAddress(addr)).toBe(true)
    expect(viemIsAddress(addr)).toBe(true)
  })

  it('agree on invalid addresses', () => {
    expect(ethersIsAddress('not-an-address')).toBe(false)
    expect(viemIsAddress('not-an-address')).toBe(false)
    expect(ethersIsAddress('0x')).toBe(false)
    expect(viemIsAddress('0x')).toBe(false)
    expect(ethersIsAddress('')).toBe(false)
    expect(viemIsAddress('')).toBe(false)
  })

  it('agree on the zero address', () => {
    const zero = '0x0000000000000000000000000000000000000000'
    expect(ethersIsAddress(zero)).toBe(true)
    expect(viemIsAddress(zero)).toBe(true)
  })

  it('both reject bad checksums', () => {
    const badChecksum = '0x5AAEB6053f3e94c9b9a09f33669435e7ef1beaed'
    expect(ethersIsAddress(badChecksum)).toBe(false)
    expect(viemIsAddress(badChecksum)).toBe(false)
  })

  // ethers accepts bare hex strings without the 0x prefix.
  // viem requires the 0x prefix.
  // Impact: user-supplied addresses without 0x would validate under
  // ethers but fail under viem.
  it('missing 0x prefix: ethers accepts, viem rejects', () => {
    const bare = '5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'
    expect(ethersIsAddress(bare)).toBe(true)
    expect(viemIsAddress(bare)).toBe(false)
  })
})
