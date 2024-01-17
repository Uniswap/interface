export function countSignificantFigures(num: number): number {
  const str = num.toString()

  // Remove decimal point if it exists
  const noPoint = str.replace('.', '')

  // Remove leading zeros
  const noLeadingZeros = noPoint.replace(/^0+/, '')

  // Remove trailing zeros if number is an integer
  const noTrailingZeros = str.includes('.') ? noLeadingZeros : noLeadingZeros.replace(/0+$/, '')

  return noTrailingZeros.length
}
