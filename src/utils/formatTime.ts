export const getFormattedTimeFromSecond = (numberOfSeconds: number) => {
  const second = numberOfSeconds % 60
  const estimatedRemainingMinutes = (numberOfSeconds - second) / 60
  const minute = estimatedRemainingMinutes % 60
  const estimatedRemainingHours = (estimatedRemainingMinutes - minute) / 60
  const hour = estimatedRemainingHours % 24
  const estimatedRemainingDays = (estimatedRemainingHours - hour) / 24

  let formattedEstimatedRemainingTime = ''

  if (estimatedRemainingDays) {
    formattedEstimatedRemainingTime += `${estimatedRemainingDays}D `
  }

  if (hour) {
    formattedEstimatedRemainingTime += `${hour}H `
  }

  if (minute) {
    formattedEstimatedRemainingTime += `${minute}M`
  }

  return formattedEstimatedRemainingTime
}
