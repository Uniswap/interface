/** Neutral text color for a zero or absent delta. */
export const DEFAULT_DELTA_COLOR = '$neutral2'

/** Status color for a signed delta: red below zero, green above, neutral when zero or absent. */
export function getDeltaTextColor(
  delta: number | undefined,
): '$statusCritical' | '$statusSuccess' | typeof DEFAULT_DELTA_COLOR {
  if (delta === undefined || delta === 0) {
    return DEFAULT_DELTA_COLOR
  }
  return delta < 0 ? '$statusCritical' : '$statusSuccess'
}
