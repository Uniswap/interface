import { CurrencyAmount } from '@uniswap/sdk-core'
import { DAI } from 'uniswap/src/constants/tokens'
import { applyNativeTokenPercentageBuffer, hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { MAINNET_CURRENCY } from 'uniswap/src/test/fixtures'

const ZERO_ETH = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, 0)
const ONE_ETH = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, 1e18)
const TEN_ETH = ONE_ETH.multiply(10)

describe(applyNativeTokenPercentageBuffer, () => {
  it('returns undefined if no currency amount is provided', () => {
    expect(applyNativeTokenPercentageBuffer(undefined, 10)).toBeUndefined()
  })

  it('takes a percentage and returns the remaining amount', () => {
    expect(applyNativeTokenPercentageBuffer(ONE_ETH, 10)?.quotient.toString()).toEqual('900000000000000000')
  })

  it('handles decimal based percentage buffers', () => {
    expect(applyNativeTokenPercentageBuffer(ONE_ETH, 1.5)?.quotient.toString()).toEqual('985000000000000000')
  })

  it('returns the original amount if no percentage is provided', () => {
    expect(applyNativeTokenPercentageBuffer(ONE_ETH, 0)?.quotient.toString()).toEqual('1000000000000000000')
  })

  it('returns the original amount if the currency is not native', () => {
    expect(
      applyNativeTokenPercentageBuffer(CurrencyAmount.fromRawAmount(DAI, '100000000'), 10)?.quotient.toString(),
    ).toEqual('100000000')
  })
})

describe(hasSufficientFundsIncludingGas, () => {
  it('correctly returns when there is enough for gas with no tx value', () => {
    const mockParams = {
      transactionAmount: undefined,
      gasFee: '1000',
      nativeCurrencyBalance: ONE_ETH,
    }

    expect(hasSufficientFundsIncludingGas(mockParams)).toBe(true)
  })

  it('correctly returns when there is enough for gas even with tx value', () => {
    const mockParams = {
      transactionAmount: ONE_ETH,
      gasFee: '1000',
      nativeCurrencyBalance: TEN_ETH,
    }

    expect(hasSufficientFundsIncludingGas(mockParams)).toBe(true)
  })

  it('correctly returns when there is not enough gas with no tx value', () => {
    const mockParams = {
      transactionAmount: undefined,
      gasFee: '1000',
      nativeCurrencyBalance: ZERO_ETH,
    }

    expect(hasSufficientFundsIncludingGas(mockParams)).toBe(false)
  })

  it('correctly returns when there is not enough gas with a tx value', () => {
    const mockParams = {
      transactionAmount: ONE_ETH,
      gasFee: '1000',
      nativeCurrencyBalance: ZERO_ETH,
    }

    expect(hasSufficientFundsIncludingGas(mockParams)).toBe(false)
  })
})
