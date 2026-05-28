import { PlatformSplitStubError } from 'utilities/src/errors'

export function reportPerformanceTiming(_eventName: string, _durationMs: number): void {
  throw new PlatformSplitStubError('reportPerformanceTiming')
}
