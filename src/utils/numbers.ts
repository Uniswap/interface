import { EPSILON } from 'constants/index'

// using a currency library here in case we want to add more in future
export const formatDollarAmount = (num: number | undefined, digits = 2) => {
  if (num === 0) return '$0.00'
  if (!num) return '-'
  if (num < 0.001 && digits <= 3) {
    return '<$0.001'
  }
  const fractionDigits = num > 1000 ? 2 : digits
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
    .format(num)
    .toLowerCase()
}

// do the same with above, without the $ sign
export const formatNotDollarAmount = (num: number | undefined, digits = 2) => {
  if (num === 0) return '0.00'
  if (!num) return '-'
  if (num < 0.001 && digits <= 3) {
    return '<0.001'
  }
  const fractionDigits = num > 1000 ? 2 : digits
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
    .format(num)
    .toLowerCase()
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
