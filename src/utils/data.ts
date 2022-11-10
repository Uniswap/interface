/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow: string | undefined, value24HoursAgo: string | undefined): number => {
  if (valueNow && value24HoursAgo) {
    const change = ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) / parseFloat(value24HoursAgo)) * 100
    if (isFinite(change)) return change
  }
  return 0
}
