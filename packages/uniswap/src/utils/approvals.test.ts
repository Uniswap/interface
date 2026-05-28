import { MaxUint256 } from '@uniswap/sdk-core'
import { encodeERC20ApproveCalldata, parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'

describe(encodeERC20ApproveCalldata, () => {
  it('encodes approve calldata that parseERC20ApproveCalldata can round-trip', () => {
    const spender = '0x000000000022d473030f116ddee9f6b43ac78ba3'
    const amount = BigInt(MaxUint256.toString())
    const calldata = encodeERC20ApproveCalldata(spender, amount)
    const parsed = parseERC20ApproveCalldata(calldata)
    expect(parsed.spender.toLowerCase()).toBe(spender.toLowerCase())
    expect(parsed.amount.toString()).toBe(amount.toString())
  })
})

describe(parseERC20ApproveCalldata, () => {
  it('Returns proper address and amount for max spend', () => {
    const calldata =
      '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

    MaxUint256.toString(16)

    const { amount, spender } = parseERC20ApproveCalldata(calldata)

    expect(amount.toString()).toEqual(MaxUint256.toString())
    expect(spender).toEqual('0x000000000022d473030f116ddee9f6b43ac78ba3')
  })

  it('Returns proper address and amount for non-max spend', () => {
    const calldata =
      '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba30000000000000000000000000000000000000000000000000000000000000001'

    MaxUint256.toString(16)

    const { amount, spender } = parseERC20ApproveCalldata(calldata)

    expect(amount.toString()).toEqual('1')
    expect(spender).toEqual('0x000000000022d473030f116ddee9f6b43ac78ba3')
  })

  it('Returns proper address and amount for 0 spend', () => {
    const calldata =
      '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba30000000000000000000000000000000000000000000000000000000000000000'

    MaxUint256.toString(16)

    const { amount, spender } = parseERC20ApproveCalldata(calldata)

    expect(amount.toString()).toEqual('0')
    expect(spender).toEqual('0x000000000022d473030f116ddee9f6b43ac78ba3')
  })
})
