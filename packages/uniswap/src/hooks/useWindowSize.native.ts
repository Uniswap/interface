import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'

export type WindowSize = {
  width: number | undefined
  height: number | undefined
}

export function useWindowSize(): WindowSize {
  const { fullWidth, fullHeight } = useDeviceDimensions()
  return { width: fullWidth, height: fullHeight }
}

export function useIsExtraLargeScreen(): boolean {
  return false
}
