import { BigNumber } from '@ethersproject/bignumber'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { hasLPFoTTransferError } from 'components/Liquidity/utils/hasLPFoTTransferError'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { describe, expect, it } from 'vitest'

function makeCurrencyInfo({
  isNative = false,
  buyFeeBps,
  sellFeeBps,
  blockaidBuyFeePercent,
  blockaidSellFeePercent,
}: {
  isNative?: boolean
  buyFeeBps?: BigNumber | undefined
  sellFeeBps?: BigNumber | undefined
  blockaidBuyFeePercent?: number
  blockaidSellFeePercent?: number
} = {}) {
  return {
    currency: {
      isNative,
      wrapped: {
        buyFeeBps,
        sellFeeBps,
      },
    },
    safetyInfo: {
      blockaidFees: {
        buyFeePercent: blockaidBuyFeePercent,
        sellFeePercent: blockaidSellFeePercent,
      },
    },
  } as CurrencyInfo
}

describe('hasLPFoTTransferError', () => {
  it('returns undefined if currency is undefined', () => {
    const result = hasLPFoTTransferError(undefined, ProtocolVersion.V3)
    expect(result).toBeUndefined()
  })

  it('returns undefined if currency is native', () => {
    const result = hasLPFoTTransferError(
      makeCurrencyInfo({ isNative: true, buyFeeBps: BigNumber.from(1) }),
      ProtocolVersion.V3,
    )
    expect(result).toBeUndefined()
  })

  it('returns undefined for v2', () => {
    const result = hasLPFoTTransferError(
      makeCurrencyInfo({
        buyFeeBps: BigNumber.from(1),
      }),
      ProtocolVersion.V2,
    )
    expect(result).toBeUndefined()
  })

  it('returns currencyInfo if wrapped.buyFeeBps > 0', () => {
    const result = hasLPFoTTransferError(makeCurrencyInfo({ buyFeeBps: BigNumber.from(1) }), ProtocolVersion.V3)
    expect(result).toBeDefined()
  })

  it('returns currencyInfo if blockaidFees.buyFeePercent > 0', () => {
    const result = hasLPFoTTransferError(
      makeCurrencyInfo({ buyFeeBps: BigNumber.from(0), blockaidBuyFeePercent: 1 }),
      ProtocolVersion.V3,
    )
    expect(result).toBeDefined()
  })

  it('returns currencyInfo if wrapped.sellFeeBps > 0', () => {
    const result = hasLPFoTTransferError(makeCurrencyInfo({ sellFeeBps: BigNumber.from(2) }), ProtocolVersion.V4)
    expect(result).toBeDefined()
  })

  it('returns currencyInfo if blockaidFees.sellFeePercent > 0', () => {
    const result = hasLPFoTTransferError(
      makeCurrencyInfo({ sellFeeBps: BigNumber.from(0), blockaidSellFeePercent: 2 }),
      ProtocolVersion.V4,
    )
    expect(result).toBeDefined()
  })

  it('returns undefined if all fees are zero or undefined', () => {
    const result = hasLPFoTTransferError(
      makeCurrencyInfo({
        buyFeeBps: BigNumber.from(0),
        sellFeeBps: BigNumber.from(0),
        blockaidBuyFeePercent: 0,
        blockaidSellFeePercent: 0,
      }),
      ProtocolVersion.V3,
    )
    expect(result).toBeUndefined()
  })

  it('returns undefined if wrapped.buyFeeBps and sellFeeBps are undefined and blockaidFees are zero/undefined', () => {
    const result = hasLPFoTTransferError(
      makeCurrencyInfo({ blockaidBuyFeePercent: 0, blockaidSellFeePercent: 0 }),
      ProtocolVersion.V4,
    )
    expect(result).toBeUndefined()
  })
})
