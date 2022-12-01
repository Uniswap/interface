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
