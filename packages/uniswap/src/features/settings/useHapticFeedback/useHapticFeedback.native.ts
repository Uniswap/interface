// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { ImpactFeedbackStyle, impactAsync, NotificationFeedbackType, notificationAsync } from 'expo-haptics'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setHapticsEnabled } from 'uniswap/src/features/settings/slice'
import {
  HapticFeedback,
  HapticFeedbackControl,
  HapticFeedbackStyle,
  NO_HAPTIC_FEEDBACK,
} from 'uniswap/src/features/settings/useHapticFeedback/types'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

const ENABLED_HAPTIC_FEEDBACK: HapticFeedback = {
  impact: (style?: HapticFeedbackStyle) => {
    const impactStyle = style ?? ImpactFeedbackStyle.Light
    return isImpactFeedbackStyle(impactStyle) ? impactAsync(impactStyle) : notificationAsync(impactStyle)
  },
  light: () => impactAsync(ImpactFeedbackStyle.Light),
  success: () => notificationAsync(NotificationFeedbackType.Success),
}

function isImpactFeedbackStyle(style: HapticFeedbackStyle): style is ImpactFeedbackStyle {
  return Object.values(ImpactFeedbackStyle).includes(style as ImpactFeedbackStyle)
}

export function useHapticFeedback(): HapticFeedbackControl {
  const hapticsEnabled = useSelector((state: UniswapState) => state.userSettings.hapticsEnabled)
  const dispatch = useDispatch()

  const handleSetEnabled = useCallback(
    (enabled: boolean): void => {
      dispatch(setHapticsEnabled(enabled))
    },
    [dispatch],
  )

  const hapticFeedback = hapticsEnabled ? ENABLED_HAPTIC_FEEDBACK : NO_HAPTIC_FEEDBACK

  return {
    hapticFeedback,
    hapticsEnabled,
    setHapticsEnabled: handleSetEnabled,
  }
}
