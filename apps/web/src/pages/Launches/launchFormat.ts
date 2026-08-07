import { getDurationRemainingString } from 'utilities/src/time/duration'

/** "1d 20h 26m"-style countdown for the trending card's remaining label. */
export function formatLaunchTimeRemaining(endsInSeconds: number): string {
  return getDurationRemainingString(Date.now() + endsInSeconds * 1000)
}

export function formatDurationShort(seconds: number): string {
  if (seconds < 3600) {
    return `${Math.max(1, Math.round(seconds / 60))}m`
  }
  if (seconds < 86400) {
    return `${Math.round(seconds / 3600)}h`
  }
  return `${Math.round(seconds / 86400)}d`
}
