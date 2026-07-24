import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { isIOS } from '@universe/environment'
import { ComponentProps } from 'react'
import { Easing } from 'react-native-reanimated'

/**
 * iOS animation config — duration-based to avoid the Reanimated 4 spring
 * issue where `damping/stiffness/mass` configs without
 * `restDisplacementThreshold/restSpeedThreshold` (removed in Reanimated 4)
 * fall back to very strict default rest thresholds and take 3+ seconds to
 * settle. Duration-based timing finishes deterministically.
 *
 * 250ms with easeOut(exp) matches gorhom's own Android default and is
 * close to the previous spring's perceived snappiness.
 */
const ANIMATION_CONFIGS_IOS = {
  duration: 250,
  easing: Easing.out(Easing.exp),
} satisfies ComponentProps<typeof BottomSheetModal>['animationConfigs']

/**
 * Android animation config. Based on default values from
 * the gorhom/bottom-sheet library.
 */
const ANIMATION_CONFIGS_ANDROID = {
  duration: 200,
  easing: Easing.out(Easing.exp),
} satisfies ComponentProps<typeof BottomSheetModal>['animationConfigs']

// Defer heavy gated content until just after the open animation (250ms) settles, so a large
// initial mount can't stall the sheet mid-present under Fabric. Was 100ms (fired mid-animation).
export const IS_SHEET_READY_DELAY = 350
export const BSM_ANIMATION_CONFIGS = isIOS ? ANIMATION_CONFIGS_IOS : ANIMATION_CONFIGS_ANDROID
