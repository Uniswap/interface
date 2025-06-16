import { ImpactFeedbackStyle, NotificationFeedbackType, impactAsync, notificationAsync } from 'expo-haptics'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectHapticsEnabled, setHapticsUserSettingEnabled } from 'wallet/src/features/appearance/slice'

type HapticFeedbackStyle = ImpactFeedbackStyle | NotificationFeedbackType

type HapticFeedback = {
  impact: (style?: HapticFeedbackStyle) => Promise<void>
  light: () => Promise<void>
  success: () => Promise<void>
}

const NO_HAPTIC_FEEDBACK: HapticFeedback = {
  impact: async () => Promise.resolve(),
  light: async () => Promise.resolve(),
  success: async () => Promise.resolve(),
}

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

interface HapticFeedbackControl {
  hapticFeedback: HapticFeedback
  hapticsEnabled: boolean
  setHapticsEnabled: (willBeEnabled: boolean) => void
}

export function useHapticFeedback(): HapticFeedbackControl {
  const hapticsEnabled = useSelector(selectHapticsEnabled)
  const dispatch = useDispatch()

  const handleSetEnabled = useCallback(
    (enabled: boolean): void => {
      dispatch(setHapticsUserSettingEnabled(enabled))
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
