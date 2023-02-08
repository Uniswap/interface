import numbro from 'numbro'

import { EPSILON } from 'constants/index'

// using a currency library here in case we want to add more in future
export const formatDollarAmount = (num: number | undefined, digits = 2, round = true) => {
  if (num === 0) return '$0.00'
  if (!num) return '-'
  if (num < 0.001 && digits <= 3) {
    return '<$0.001'
  }

  return numbro(num).formatCurrency({
    average: round,
    mantissa: num > 1000 ? 2 : digits,
    abbreviations: {
      million: 'M',
      billion: 'B',
    },
  })
}

// do the same with above, without the $ sign
export const formatNotDollarAmount = (num: number | undefined, digits = 2, round = true) => {
  if (num === 0) return '0.00'
  if (!num) return '-'
  if (num < 0.001 && digits <= 3) {
    return '<0.001'
  }

  return numbro(num).format({
    average: round,
    mantissa: num > 1000 ? 2 : digits,
    abbreviations: {
      thousand: 'K',
      million: 'M',
      billion: 'B',
      trillion: 'T',
    },
  })
}

export function isEqual(a: number, b: number, ep = EPSILON) {
  return Math.abs(a - b) < ep
}

// https://stackoverflow.com/a/1685917/8153505
export function toFixed(x: number): string {
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split('e-')[1])
    if (e) {
      x *= Math.pow(10, e - 1)
      return '0.' + '0'.repeat(e - 1) + x.toString().substring(2)
    }
  } else {
    let e = parseInt(x.toString().split('+')[1])
    if (e > 20) {
      e -= 20
      x /= Math.pow(10, e)
      return x.toString() + '0'.repeat(e)
    }
  }
  return x.toString()
}
