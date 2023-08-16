/**
 * Returns the time elapsed between page load and now.
 */
export function calculateElapsedTimeWithPerformanceMark(markName: string): number {
  const elapsedTime = performance.mark(markName)
  return elapsedTime.startTime
}
