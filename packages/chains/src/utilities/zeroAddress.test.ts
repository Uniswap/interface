import { AddressZero } from '@ethersproject/constants'
import { describe, expect, it } from 'vitest'
import { zeroAddress } from './createZeroAddress'

describe('zeroAddress', () => {
  it('matches ethers AddressZero', () => {
    expect(zeroAddress).toEqual(AddressZero)
  })

  it('is the standard zero address', () => {
    expect(zeroAddress).toEqual('0x0000000000000000000000000000000000000000')
  })
})
