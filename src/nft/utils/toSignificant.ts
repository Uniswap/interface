/**
 * Format number in human-readable way
 * @example
 * ```js
 * nFormat(134_256) // => 134K
 * ```
 * @param num number to format
 * @param digits digits after decimal point
 * @returns formatted number string
 */
export function nFormat(num: number, digits = 0): string {
  const lookup = [
    { value: 1, symbol: '' },
    //{ value: 1e3, symbol: 'K' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'Qa' },
    { value: 1e18, symbol: 'Qi' },
  ]
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
  const item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value)
  return item ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol : '0'
}

/**
 * Rounds a number to significant 4-digit number
 * @param n number
 * @param precision
 * @returns formatted number
 */
export const toSignificant = (n: string, precision = 4): string => {
  const floatBal = parseFloat(n)

  if (floatBal > 9999) return nFormat(floatBal, 0)

  return floatBal.toPrecision(precision)
}

/**
 * Formats percent change values
 * @param v number
 * @returns formatted number
 */
export const formatChange = (v: number) => {
  if (v >= 98) return nFormat(v, 2)
  else if (v <= 0.1) return v.toFixed(2)
  else return v.toPrecision(2)
}
