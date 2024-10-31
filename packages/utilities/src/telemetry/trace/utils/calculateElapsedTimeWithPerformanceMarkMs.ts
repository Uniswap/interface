import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Returns the time elapsed between page load and now in milliseconds.
 * @param markName the identifier for the performance mark to be created and measured.
 */
export function calculateElapsedTimeWithPerformanceMarkMs(
  _markName: string,
  _fallbackStartTime?: number,
): number | undefined {
  throw new PlatformSplitStubError('calculateElapsedTimeWithPerformanceMarkMs')
}
