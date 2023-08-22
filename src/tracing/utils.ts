/**
 * Returns the time elapsed between page load and now.
 * @param markName the identifier for the performance mark to be created and measured.
 */
export function calculateElapsedTimeWithPerformanceMark(markName: string): number {
  const elapsedTime = performance.mark(markName)
  return elapsedTime.startTime
}
