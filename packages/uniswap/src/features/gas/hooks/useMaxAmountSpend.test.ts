import { CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { DAI } from 'uniswap/src/constants/tokens'
import {
  useMaxAmountSpend,
  useMinEthForGas,
  useMinGenericL2ForGas,
  useMinPolygonForGas,
} from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { ARBITRUM_CURRENCY, MAINNET_CURRENCY, OPTIMISM_CURRENCY, POLYGON_CURRENCY } from 'uniswap/src/test/fixtures'

jest.mock('uniswap/src/features/gating/hooks', () => {
  return {
    useDynamicConfigValue: jest
      .fn()
      .mockImplementation(({ defaultValue }: { config: unknown; key: unknown; defaultValue: unknown }) => {
        return defaultValue
      }),
  }
})

describe(useMaxAmountSpend, () => {
  it('handles undefined', () => {
    expect(useMaxAmountSpend({ currencyAmount: undefined })).toEqual(undefined)
    expect(useMaxAmountSpend({ currencyAmount: null })).toEqual(undefined)
  })

  it('handles token amounts', () => {
    const tokenAmount = CurrencyAmount.fromRawAmount(DAI, '100000000')
    expect(useMaxAmountSpend({ currencyAmount: tokenAmount })).toBe(tokenAmount)
  })

  // ETH Mainnet

  it('reserves gas for large amounts on ETH Mainnet', () => {
    const MIN_ETH_FOR_GAS = useMinEthForGas()
    const amount = CurrencyAmount.fromRawAmount(
      MAINNET_CURRENCY,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_ETH_FOR_GAS)),
    )
    const amount1Spend = useMaxAmountSpend({ currencyAmount: amount })
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small amounts on ETH Mainnet', () => {
    const MIN_ETH_FOR_GAS = useMinEthForGas()
    const amount = CurrencyAmount.fromRawAmount(
      MAINNET_CURRENCY,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_ETH_FOR_GAS)),
    )
    const amount1Spend = useMaxAmountSpend({ currencyAmount: amount })
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })

  // Polygon

  it('reserves gas for large amounts on Polygon', () => {
    const MIN_POLYGON_FOR_GAS = useMinPolygonForGas()
    const amount = CurrencyAmount.fromRawAmount(
      POLYGON_CURRENCY,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_POLYGON_FOR_GAS)),
    )
    const amount1Spend = useMaxAmountSpend({ currencyAmount: amount })
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small amounts on Polygon', () => {
    const MIN_POLYGON_FOR_GAS = useMinPolygonForGas()
    const amount = CurrencyAmount.fromRawAmount(
      POLYGON_CURRENCY,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_POLYGON_FOR_GAS)),
    )
    const amount1Spend = useMaxAmountSpend({ currencyAmount: amount })
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })

  // Arbitrum

  it('reserves gas for large amounts on Arbitrum', () => {
    const MIN_ARBITRUM_FOR_GAS = useMinGenericL2ForGas()
    const amount = CurrencyAmount.fromRawAmount(
      ARBITRUM_CURRENCY,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_ARBITRUM_FOR_GAS)),
    )
    const amount1Spend = useMaxAmountSpend({ currencyAmount: amount })
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small amounts on Arbitrum', () => {
    const MIN_ARBITRUM_FOR_GAS = useMinGenericL2ForGas()
    const amount = CurrencyAmount.fromRawAmount(
      ARBITRUM_CURRENCY,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_ARBITRUM_FOR_GAS)),
    )
    const amount1Spend = useMaxAmountSpend({ currencyAmount: amount })
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })

  // Optimism

  it('reserves gas for large amounts on Optimism', () => {
    const MIN_OPTIMISM_FOR_GAS = useMinGenericL2ForGas()
    const amount = CurrencyAmount.fromRawAmount(
      OPTIMISM_CURRENCY,
      JSBI.add(JSBI.BigInt(99), JSBI.BigInt(MIN_OPTIMISM_FOR_GAS)),
    )
    const amount1Spend = useMaxAmountSpend({ currencyAmount: amount })
    expect(amount1Spend?.quotient.toString()).toEqual('99')
  })

  it('handles small amounts on Optimism', () => {
    const MIN_OPTIMISM_FOR_GAS = useMinGenericL2ForGas()
    const amount = CurrencyAmount.fromRawAmount(
      OPTIMISM_CURRENCY,
      JSBI.subtract(JSBI.BigInt(99), JSBI.BigInt(MIN_OPTIMISM_FOR_GAS)),
    )
    const amount1Spend = useMaxAmountSpend({ currencyAmount: amount })
    expect(amount1Spend?.quotient.toString()).toEqual('0')
  })
})
