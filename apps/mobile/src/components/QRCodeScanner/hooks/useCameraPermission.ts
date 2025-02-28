import { useCameraPermissions } from 'expo-camera'
import { usePreventLock } from 'src/features/lockScreen/hooks/usePreventLock'
import { useEvent } from 'utilities/src/react/hooks'

type UseCameraPermissionsResult = ReturnType<typeof useCameraPermissions>

/**
 * Custom hook to handle camera permissions with Android-specific considerations.
 *
 * On Android, requesting permissions causes the app to briefly enter a background state.
 * We use preventLock to ensure this temporary background state doesn't trigger any
 * app lock mechanisms during the permission request flow.
 */
export const useCameraPermission = (): UseCameraPermissionsResult => {
  const [permission, _requestPermission, ...rest] = useCameraPermissions()
  const { preventLock } = usePreventLock()

  const requestPermission = useEvent(async () => {
    return preventLock(_requestPermission)
  })

  return [permission, requestPermission, ...rest] as const
}
