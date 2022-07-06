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

  if (estimatedRemainingDays || !showDetail) {
    unit = (showDetail ? ' Day' : 'D') + (showDetail && estimatedRemainingDays > 1 ? 's ' : ' ')
    formattedEstimatedRemainingTime += estimatedRemainingDays + unit
  }

  if (hour || !showDetail) {
    unit = (showDetail ? ' Hour' : 'H') + (showDetail && hour > 1 ? 's ' : ' ')
    formattedEstimatedRemainingTime += hour + unit
  }

  if (minute || !showDetail) {
    unit = (showDetail ? ' Minute' : 'M') + (showDetail && minute > 1 ? 's ' : ' ')
    formattedEstimatedRemainingTime += minute + unit
  }

  const showSecond = estimatedRemainingDays === 0 && hour === 0 && minute === 0
  if (showSecond) {
    unit = (showDetail ? ' Second' : 'S') + (showDetail && second > 1 ? 's ' : ' ')
    formattedEstimatedRemainingTime += Math.trunc(second) + unit
  }

  return formattedEstimatedRemainingTime
}
