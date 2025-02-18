import { DependencyList } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function usePerformanceLogger(_eventName: string, _dependencyList: DependencyList): void {
  throw new PlatformSplitStubError('usePerformanceLogger')
}
