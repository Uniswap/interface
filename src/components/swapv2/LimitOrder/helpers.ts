import { Currency, Fraction } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ethers } from 'ethers'
import JSBI from 'jsbi'

import { RESERVE_USD_DECIMALS } from 'constants/index'
import { tryParseAmount } from 'state/swap/hooks'
import { formatNumberWithPrecisionRange, formattedNum } from 'utils'
import { toFixed } from 'utils/numbers'

import { CreateOrderParam, LimitOrder, LimitOrderStatus } from './type'

export const isActiveStatus = (status: LimitOrderStatus) =>
  [LimitOrderStatus.ACTIVE, LimitOrderStatus.OPEN, LimitOrderStatus.PARTIALLY_FILLED].includes(status)

// js number to fraction
function parseFraction(value: string, decimals = RESERVE_USD_DECIMALS) {
  try {
    return new Fraction(
      ethers.utils.parseUnits(value, decimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)),
    )
  } catch (error) {
    return new Fraction(0)
  }
}

// 1.00010000 => 1.0001
export const removeTrailingZero = (value: string) => parseFloat(value).toString()

const uint256ToFraction = (value: string, decimals = RESERVE_USD_DECIMALS) =>
  new Fraction(value, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))

export function calcOutput(input: string, rate: string, decimalsOut: number) {
  try {
    const value = parseFraction(input).multiply(parseFraction(rate))
    return toFixed(parseFloat(value.toFixed(decimalsOut)))
  } catch (error) {
    return ''
  }
}

export function calcRate(input: string, output: string, decimalsOut: number) {
  try {
    if (input && input === output) return '1'
    const rate = parseFraction(output, decimalsOut).divide(parseFraction(input))
    return toFixed(parseFloat(rate.toFixed(16)))
  } catch (error) {
    return ''
  }
}

// calc 1/value
export function calcInvert(value: string) {
  try {
    if (parseFloat(value) === 1) return '1'
    return toFixed(parseFloat(new Fraction(1).divide(parseFraction(value)).toFixed(16)))
  } catch (error) {
    return ''
  }
}

export const calcUsdPrices = ({
  inputAmount,
  outputAmount,
  priceUsdIn,
  priceUsdOut,
  currencyIn,
  currencyOut,
}: {
  inputAmount: string
  outputAmount: string
  priceUsdIn: number | undefined
  priceUsdOut: number | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}) => {
  const empty = { input: '', output: '', rawInput: 0 }
  if (!inputAmount || !priceUsdIn || !priceUsdOut || !outputAmount || !currencyIn || !currencyOut) return empty
  try {
    const inputAmountInUsd = parseFraction(priceUsdIn.toString()) // 1 knc = ??? usd
    const outputAmountInUsd = parseFraction(priceUsdOut.toString())

    const input = parseFraction(inputAmount, currencyIn.decimals).multiply(inputAmountInUsd)
    const output = parseFraction(outputAmount, currencyOut.decimals).multiply(outputAmountInUsd)
    return {
      input: input ? `${formattedNum(input.toFixed(16), true)}` : undefined,
      output: output ? `${formattedNum(output.toFixed(16), true)}` : undefined,
      rawInput: parseFloat(input.toFixed(2)),
    }
  } catch (error) {
    return empty
  }
}

export const formatAmountOrder = (value: string, decimals?: number) => {
  const isUint256 = decimals !== undefined
  return formatNumberWithPrecisionRange(
    parseFloat(isUint256 ? uint256ToFraction(value, decimals).toFixed(16) : value),
    0,
    10,
  )
}

export const formatRateLimitOrder = (order: LimitOrder, invert: boolean) => {
  let rateValue = new Fraction(0)
  const { takingAmount, makingAmount, makerAssetDecimals, takerAssetDecimals } = order
  try {
    rateValue = invert
      ? uint256ToFraction(takingAmount, takerAssetDecimals).divide(uint256ToFraction(makingAmount, makerAssetDecimals))
      : uint256ToFraction(makingAmount, makerAssetDecimals).divide(uint256ToFraction(takingAmount, takerAssetDecimals))
  } catch (error) {
    console.log(error)
  }
  return formatNumberWithPrecisionRange(parseFloat(rateValue.toFixed(16)), 0, 8)
}

export const calcPercentFilledOrder = (value: string, total: string, decimals: number) => {
  try {
    const float = parseFloat(
      uint256ToFraction(value, decimals).divide(uint256ToFraction(total, decimals)).multiply(100).toFixed(16),
    )
    return float && float < 0.01 ? '< 0.01' : formatNumberWithPrecisionRange(float, 0, 2)
  } catch (error) {
    console.log(error)
    return '0'
  }
}

export const getErrorMessage = (error: any) => {
  console.error('Limit order error: ', error)
  const errorCode: string = error?.response?.data?.code || error.code || ''
  const mapErrorMessageByErrCode: { [code: string]: string } = {
    4001: t`User denied message signature`,
    4002: t`You don't have sufficient fund for this transaction.`,
    4004: t`Invalid signature`,
    '-32603': t`Error occurred. Please check your device.`,
  }
  const msg = mapErrorMessageByErrCode[errorCode]
  return msg?.toString?.() || error?.message || 'Error occur. Please try again.'
}

export const getPayloadCreateOrder = (params: CreateOrderParam) => {
  const { currencyIn, currencyOut, chainId, account, inputAmount, outputAmount, expiredAt } = params
  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  return {
    chainId: chainId.toString(),
    makerAsset: currencyIn?.wrapped.address,
    takerAsset: currencyOut?.wrapped.address,
    maker: account,
    makingAmount: parseInputAmount?.quotient?.toString(),
    takingAmount: tryParseAmount(outputAmount, currencyOut)?.quotient?.toString(),
    expiredAt: Math.floor(expiredAt / 1000),
  }
}
