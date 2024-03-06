import { CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { DAI } from 'wallet/src/constants/tokens'
import {
  ARBITRUM_CURRENCY,
  MAINNET_CURRENCY,
  OPTIMISM_CURRENCY,
  POLYGON_CURRENCY,
} from 'wallet/src/test/fixtures'
import {
  MIN_ARBITRUM_FOR_GAS,
  MIN_ETH_FOR_GAS,
  MIN_OPTIMISM_FOR_GAS,
  MIN_POLYGON_FOR_GAS,
  maxAmountSpend,
} from 'wallet/src/utils/balance'

describe(maxAmountSpend, () => {
  it('handles undefined', () => {
    expect(maxAmountSpend(undefined)).toEqual(undefined)
    expect(maxAmountSpend(null)).toEqual(undefined)
  })

  it('handles token amounts', () => {
    const tokenAmount = CurrencyAmount.fromRawAmount(DAI, '100000000')
    expect(maxAmountSpend(tokenAmount)).toBe(tokenAmount)
  })

  // ETH Mainnet

  it('reserves gas for large amounts on ETH Mainnet', () => {
    const amount = CurrencyAmount.fromRawAmount(
      MAINNET_CURRENCY,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_ETH_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small amounts on ETH Mainnet', () => {
    const amount = CurrencyAmount.fromRawAmount(
      MAINNET_CURRENCY,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_ETH_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })

  // Polygon

  it('reserves gas for large amounts on Polygon', () => {
    const amount = CurrencyAmount.fromRawAmount(
      POLYGON_CURRENCY,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_POLYGON_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small amounts on Polygon', () => {
    const amount = CurrencyAmount.fromRawAmount(
      POLYGON_CURRENCY,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_POLYGON_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })

  // Arbitrum

  it('reserves gas for large amounts on Arbitrum', () => {
    const amount = CurrencyAmount.fromRawAmount(
      ARBITRUM_CURRENCY,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_ARBITRUM_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small amounts on Arbitrum', () => {
    const amount = CurrencyAmount.fromRawAmount(
      ARBITRUM_CURRENCY,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_ARBITRUM_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })

  // Optimism

  it('reserves gas for large amounts on Optimism', () => {
    const amount = CurrencyAmount.fromRawAmount(
      OPTIMISM_CURRENCY,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_OPTIMISM_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small amounts on Optimism', () => {
    const amount = CurrencyAmount.fromRawAmount(
      OPTIMISM_CURRENCY,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_OPTIMISM_FOR_GAS))
    )
    const amount1Spend = maxAmountSpend(amount)
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })
})
