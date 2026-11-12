import { useNativeActivateAction, useNativePressResponder } from '../compat/native-pressability'
import type { ButtonPressHandler } from './press-handler'

/**
 * The native Button's press wiring: responder dispatch (an enclosing TouchableArea
 * swallows the RNGH gesture on Android) plus TalkBack's `activate`. A Button with
 * no handler claims no touch, so a pressable ancestor still receives it.
 */
export function useButtonNativePress({
  pressHandler,
  blocked,
  onPressIn,
  onPressOut,
}: {
  pressHandler: ButtonPressHandler | undefined
  blocked: boolean
  onPressIn: () => void
  onPressOut: () => void
}): ReturnType<typeof useNativePressResponder> & ReturnType<typeof useNativeActivateAction> {
  const live = !blocked && pressHandler !== undefined
  const responderProps = useNativePressResponder({
    onPress: pressHandler as never,
    onPressIn: live ? (onPressIn as never) : undefined,
    onPressOut: live ? (onPressOut as never) : undefined,
    disabled: blocked,
  })
  const activateProps = useNativeActivateAction({ onPress: live ? (pressHandler as never) : undefined })
  return { ...responderProps, ...activateProps }
}
