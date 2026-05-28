import JSBI from 'jsbi'
import { logger } from 'utilities/src/logger/logger'

export function convertScientificNotationToNumber(value: string): string {
  let convertedValue = value

  // Convert scientific notation into number format so it can be parsed by BigInt properly
  // Ignore if value is a valid hex value or contains invalid number format
  if ((value.includes('e') || value.includes('E')) && !value.startsWith('0x')) {
    const [xStr, eStr] = value.split(/[eE]/) // Split on either 'e' or 'E'
    // Return original value if:
    // - missing mantissa or exponent
    // - mantissa is not a valid number
    // - exponent is not a valid number or is empty
    if (!xStr || !eStr || isNaN(Number(xStr)) || isNaN(Number(eStr))) {
      return value
    }

    let x = Number(xStr)
    let e = Number(eStr)

    if (e < 0) {
      // For negative exponents, construct the decimal string manually to preserve precision
      const isNegative = x < 0
      const xDigits = Math.abs(x).toString().replace('.', '')
      const zeros = '0'.repeat(-e - 1)
      convertedValue = `${isNegative ? '-' : ''}0.${zeros}${xDigits}`
    } else {
      // Handle positive exponents with JSBI as before
      if (xStr.includes('.')) {
        const splitX = xStr.split('.')
        const decimalPlaces = splitX[1]?.split('').length ?? 0
        e -= decimalPlaces
        x *= Math.pow(10, decimalPlaces)
      }
      try {
        convertedValue = JSBI.multiply(JSBI.BigInt(x), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(e))).toString()
      } catch (_error) {
        logger.debug(
          'convertScientificNotation',
          'convertScientificNotationToNumber',
          'BigInt arithmetic unsuccessful',
          e,
        )
        convertedValue = (x * Math.pow(10, e)).toString()
      }
    }
  }

  return convertedValue
}
