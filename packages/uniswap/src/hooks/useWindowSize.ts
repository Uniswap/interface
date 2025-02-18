import { PlatformSplitStubError } from 'utilities/src/errors'

export type WindowSize = {
  width: number | undefined
  height: number | undefined
}

// TODO: consider deprecating this hook and use `useDeviceDimensions` instead.
export function useWindowSize(): WindowSize {
  throw new PlatformSplitStubError('useWindowSize')
}

export function useIsExtraLargeScreen(): boolean {
  throw new PlatformSplitStubError('useIsExtraLargeScreen')
}
