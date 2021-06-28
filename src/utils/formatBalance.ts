import { BigNumber } from '@ethersproject/bignumber'
import { Fraction, JSBI } from 'libs/sdk/src'

export const getFullDisplayBalance = (balance: BigNumber, decimals = 18, significant = 6): string => {
  return new Fraction(balance.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(
    significant
  )
}

/**
 * Format big number of money into easy to read format
 * e.x: 299792458 => 299.8M
 *
 * @param num number
 * @param decimals number
 * @param usd boolean
 * @returns string
 */
export const formatBigLiquidity = (num: string, decimals: number, usd = true): string => {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' }
  ]

  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/

  const item = lookup
    .slice()
    .reverse()
    .find(function(item) {
      return parseFloat(num) >= item.value
    })

  const formattedValue = item ? (parseFloat(num) / item.value).toFixed(decimals).replace(rx, '$1') + item.symbol : '0'

  return usd ? `$${formattedValue}` : formattedValue
}
