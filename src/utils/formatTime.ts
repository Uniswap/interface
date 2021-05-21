export const getFormattedTimeFromSecond = (numberOfSeconds: number) => {
  const second = numberOfSeconds % 60
  const estimatedRemainingMinutes = (numberOfSeconds - second) / 60
  const minute = estimatedRemainingMinutes % 60
  const estimatedRemainingHours = (estimatedRemainingMinutes - minute) / 60
  const hour = estimatedRemainingHours % 24
  const estimatedRemainingDays = (estimatedRemainingHours - hour) / 24

  let formattedEstimatedRemainingTime = ''

  if (estimatedRemainingDays) {
    formattedEstimatedRemainingTime += `${estimatedRemainingDays}d `
  }

  if (hour) {
    formattedEstimatedRemainingTime += `${hour}hr `
  }

  if (minute) {
    formattedEstimatedRemainingTime += `${minute}m`
  }

  return formattedEstimatedRemainingTime
}
