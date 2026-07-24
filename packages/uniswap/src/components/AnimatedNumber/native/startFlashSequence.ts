import type { SharedValue } from 'react-native-reanimated'
import { withDelay, withSequence, withTiming } from 'react-native-reanimated'
import {
  FLASH_FADE_IN_MS,
  FLASH_FADE_OUT_MS,
  FLASH_HOLD_MS,
} from 'uniswap/src/components/AnimatedNumber/animationConfig'

/** Fades a balance-change flash overlay in, holds, then fades it back out — all on the UI thread. */
export function startFlashSequence(flashOpacity: SharedValue<number>): void {
  flashOpacity.value = withSequence(
    withTiming(1, { duration: FLASH_FADE_IN_MS }),
    withDelay(FLASH_HOLD_MS, withTiming(0, { duration: FLASH_FADE_OUT_MS })),
  )
}
