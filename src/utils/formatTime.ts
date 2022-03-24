export const getFormattedTimeFromSecond = (numberOfSeconds: number, showDetail = false) => {
  if (numberOfSeconds === 0) {
    return '0 Days'
  }

  const second = numberOfSeconds % 60
  const estimatedRemainingMinutes = (numberOfSeconds - second) / 60
  const minute = estimatedRemainingMinutes % 60
  const estimatedRemainingHours = (estimatedRemainingMinutes - minute) / 60
  const hour = estimatedRemainingHours % 24
  const estimatedRemainingDays = (estimatedRemainingHours - hour) / 24

  let formattedEstimatedRemainingTime = ''

  let unit: string

  if (estimatedRemainingDays) {
    unit = (showDetail ? ' Day' : 'D') + (showDetail && estimatedRemainingDays > 1 ? 's ' : ' ')
    formattedEstimatedRemainingTime += estimatedRemainingDays + unit
  }

  if (hour) {
    unit = (showDetail ? ' Hour' : 'H') + (showDetail && hour > 1 ? 's ' : ' ')
    formattedEstimatedRemainingTime += hour + unit
  }

  if (minute) {
    unit = (showDetail ? ' Minute' : 'M') + (showDetail && minute > 1 ? 's ' : ' ')
    formattedEstimatedRemainingTime += minute + unit
  }

  return formattedEstimatedRemainingTime
}
