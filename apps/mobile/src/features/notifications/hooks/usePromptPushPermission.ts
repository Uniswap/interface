import { usePreventLock } from 'src/features/lockScreen/hooks/usePreventLock'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Custom hook to handle push notification permissions with Android-specific considerations.
 *
 * On Android, requesting permissions causes the app to briefly enter a background state.
 * We use preventLock to ensure this temporary background state doesn't trigger any
 * app lock mechanisms during the permission request flow.
 *
 * @see https://github.com/OneSignal/react-native-onesignal/issues/1658#issuecomment-1974849646
 */
export function usePromptPushPermission(): () => Promise<boolean> {
  const { preventLock } = usePreventLock()

  return useEvent(async (): Promise<boolean> => {
    return preventLock(promptPushPermission)
  })
}
