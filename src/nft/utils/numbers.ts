export const isNumber = (s: string): boolean => {
  const reg = /^-?\d+\.?\d*$/
  return reg.test(s) && !isNaN(parseFloat(s)) && isFinite(parseFloat(s))
}

export const formatPercentage = (percentage: string): string => {
  if (!percentage) return '-'
  return `${parseFloat(percentage)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`
}
