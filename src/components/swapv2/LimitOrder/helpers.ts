import { Fraction } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import JSBI from 'jsbi'

import { formatNumberWithPrecisionRange, formattedNum } from 'utils'

import { LimitOrder, LimitOrderStatus } from './type'

export const isActiveStatus = (status: LimitOrderStatus) =>
  [LimitOrderStatus.ACTIVE, LimitOrderStatus.OPEN, LimitOrderStatus.PARTIALLY_FILLED].includes(status)

// js number to fraction
function parseFraction(value: string, decimals = 18) {
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

export const uint256ToFraction = (value: string) =>
  new Fraction(value, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)))

export function calcOutput(input: string, rate: string, decimalsIn: number, decimalsOut: number) {
  try {
    const value = parseFraction(input, decimalsIn).multiply(parseFraction(rate))
    return removeTrailingZero(value.toFixed(decimalsOut))
  } catch (error) {
    return ''
  }
}

export function calcRate(input: string, output: string, decimalsOut: number) {
  try {
    if (input && input === output) return '1'
    const rate = parseFraction(output, decimalsOut).divide(parseFraction(input))
    return removeTrailingZero(rate.toFixed(16))
  } catch (error) {
    return ''
  }
}

// calc 1/value
export function calcInvert(value: string) {
  try {
    if (parseFloat(value) === 1) return '1'
    return removeTrailingZero(new Fraction(1).divide(parseFraction(value)).toFixed(16))
  } catch (error) {
    return ''
  }
}

export function calcPriceUsd(input: string, price: number) {
  try {
    const value = parseFraction(input).multiply(parseFraction(price.toString()))
    return value.toFixed(16)
  } catch (error) {
    return
  }
}

export const formatUsdPrice = (input: string, price: number | undefined) => {
  if (!price || !input) return
  const calcPrice = calcPriceUsd(input, price)
  return calcPrice ? `${formattedNum(calcPrice, true)}` : undefined
}

export const formatAmountOrder = (value: string, isUint256 = true) => {
  return formatNumberWithPrecisionRange(parseFloat(isUint256 ? uint256ToFraction(value).toFixed(16) : value), 0, 10)
}

export const formatRateOrder = (order: LimitOrder, invert: boolean) => {
  let rateValue = new Fraction(0)
  const { takingAmount, makingAmount } = order
  try {
    rateValue = invert
      ? uint256ToFraction(takingAmount).divide(uint256ToFraction(makingAmount))
      : uint256ToFraction(makingAmount).divide(uint256ToFraction(takingAmount))
  } catch (error) {
    console.log(error)
  }
  return formatNumberWithPrecisionRange(parseFloat(rateValue.toFixed(16)), 0, 8)
}

export const calcPercentFilledOrder = (value: string, total: string) => {
  try {
    const float = parseFloat(uint256ToFraction(value).divide(uint256ToFraction(total)).multiply(100).toFixed(16))
    return float && float < 0.01 ? '< 0.01' : formatNumberWithPrecisionRange(float, 0, 2)
  } catch (error) {
    console.log(error)
    return '0'
  }
}
