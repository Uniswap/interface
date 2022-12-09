import { CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { DAI } from 'src/constants/tokens'
import { MainnetEth } from 'src/test/fixtures'
import { maxAmountSpend, MIN_NATIVE_CURRENCY_FOR_GAS } from 'src/utils/balance'

describe(maxAmountSpend, () => {
  it('handles undefined', () => {
    expect(maxAmountSpend(undefined)).toEqual(undefined)
    expect(maxAmountSpend(null)).toEqual(undefined)
  })

  it('handles token amounts', () => {
    const tokenAmount = CurrencyAmount.fromRawAmount(DAI, '100000000')
    expect(maxAmountSpend(tokenAmount)).toBe(tokenAmount)
  })

  it('reserves gas for large amounts', () => {
    const amount = CurrencyAmount.fromRawAmount(
      MainnetEth,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_NATIVE_CURRENCY_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small native amounts', () => {
    const amount = CurrencyAmount.fromRawAmount(
      MainnetEth,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_NATIVE_CURRENCY_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })
})
