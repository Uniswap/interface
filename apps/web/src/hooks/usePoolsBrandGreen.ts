import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'

/** Resolved raw hex — consumers pass it to icon/text color props and to `opacifyRaw`. */
export function usePoolsBrandGreen(): string {
  return useSporeColors().poolsBrandGreen.val
}
