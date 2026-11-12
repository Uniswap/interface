import { currentTimeInSeconds } from 'utilities/src/time/time'
export const getTradeSettingsDeadline = (customDeadline?: number): number | undefined => {
  // if custom deadline is set (in minutes), convert to unix timestamp format from now
  const deadlineSeconds = (customDeadline ?? 0) * 60
  const deadline = customDeadline ? currentTimeInSeconds() + deadlineSeconds : undefined

  return deadline
}
