/**
 * Returns the time elapsed between page load and now,
 * if the time-to-swap mark doesn't already exist.
 */
export function calculateElapsedTimeWithPerformanceMark(markName: string): number {
  const elapsedTime = performance.mark(markName)
  return elapsedTime.startTime
}
