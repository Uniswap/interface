import { useSporeColors } from 'ui/src'

export function useSurfaceColor(): string {
  return useSporeColors().surface2.val
}
