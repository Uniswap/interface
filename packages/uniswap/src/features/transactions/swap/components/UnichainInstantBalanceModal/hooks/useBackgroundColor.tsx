import { useSporeColors } from 'ui/src'

export function useBackgroundColor(): string {
  const {
    surface1: { val },
  } = useSporeColors()

  return val
}
