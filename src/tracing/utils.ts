/**
 * Returns the time elapsed between page load and now.
 * @param markName the identifier for the performance mark to be created and measured.
 */
export function calculateElapsedTimeWithPerformanceMark(markName: string): number | undefined {
  const elapsedTime = performance.mark(markName)
  if (!elapsedTime) return undefined
  return elapsedTime.startTime
}
