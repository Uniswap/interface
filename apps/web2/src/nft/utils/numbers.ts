export const roundWholePercentage = (n: number): string => {
  if (n === 0) return '0'
  if (!n) return ''
  if (n < 1) {
    return '<1'
  }
  return Math.round(n).toString()
}
