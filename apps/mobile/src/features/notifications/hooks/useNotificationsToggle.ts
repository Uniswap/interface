import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { showNotificationSettingsAlert } from 'src/screens/Onboarding/NotificationsSetupScreen'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useSelectAccountNotificationSetting } from 'wallet/src/features/wallet/hooks'

// Wait for next frame to ensure UI updates without flashing
// https://corbt.com/posts/2015/12/22/breaking-up-heavy-processing-in-react-native.html
const waitFrame = async (): Promise<void> => {
  await new Promise(requestAnimationFrame)
}

enum NotificationError {
  OsPermissionDenied = 'OS_PERMISSION_DENIED',
}

/**
 * useNotificationToggle
 *
 * Enabling notifications across different initial states.
 *
 * What goes into enabling notifications?
 * - OS permissions
 * - Firebase settings (via redux)
 *
 * What states can the user be in?
 * - Denied notifications at the OS level
 * - Enabled notifications at the OS level
 * - Denied notifications during onboarding
 * - Enabled notifications during onboarding
 * - Skipped notifications during onboarding
 *
 * Situation A: Denied notifications at the OS level
 * - User goes to toggle notifications
 * - We optimistically enable firebase settings
 * - We prompt the user to go to settings and re-enable notifications
 * - App is backgrounded and user goes to settings
 * - App is foregrounded and we refetch the OS permissions
 * - Notifications are enabled
 *
 * Situation B: User skipped notifications during onboarding
 * - User goes to toggle notifications
 * - We request the OS permissions
 * - Notifications are enabled
 *
 * Situation C: User has notifications enabled but wants to disable
 * - User goes to toggle notifications
 * - We disable Firebase settings immediately
 * - OS permissions remain enabled but notifications stop
 * - User can re-enable without OS prompt
 *
 * Situation D: User enabled during onboarding but removed OS permissions later
 * - User has Firebase enabled but OS permissions are off
 * - User goes to toggle notifications
 * - We detect mismatched state
 * - We maintain Firebase settings as enabled
 * - We prompt user to restore OS permissions
 * - Normal OS permission flow resumes
 */

export function useNotificationToggle(props: { address: string; onPermissionChanged?: (enabled: boolean) => void }): {
  isEnabled: boolean
  isPending: boolean
  toggle: () => void
} {
  const dispatch = useDispatch()

  // Get real states from different systems
  const osPermissionStatus = useNotificationOSPermissionsEnabled()
  const reduxPushNotificationsEnabled = useSelectAccountNotificationSetting(props.address)
  const isOSPermissionEnabled = osPermissionStatus === NotificationPermission.Enabled

  // Derive real enabled state - only true if both systems are enabled
  const isEnabled = isOSPermissionEnabled && reduxPushNotificationsEnabled

  // Optimistic UI state
  const [optimisticEnabled, setOptimisticEnabled] = useState<boolean>(isEnabled)

  // Helper to handle OS permission request and state update
  const requestOSPermissions = useCallback(async (): Promise<true> => {
    const granted = await promptPushPermission()
    if (!granted) {
      // first let's enable the redux state (firebase)
      // this will ensure that when the user goes to settings and enables notifications
      // we're not stuck in a state where notifications are disabled
      // and the user has to hit the toggle again
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.TogglePushNotification,
          enabled: true,
          address: props.address,
        }),
      )
      // this means the user denied the permission at the system level
      // and needs to go to settings to re-enable (boo)
      throw new Error(NotificationError.OsPermissionDenied)
    }
    return true
  }, [dispatch, props.address])

  // Reset optimistic state if real state changes
  useEffect(() => {
    setOptimisticEnabled(isEnabled)
  }, [isEnabled])

  const mutation = useMutation({
    onMutate: async () => {
      // Wait for next frame to ensure UI updates without flashing
      await waitFrame()
      // Only show optimistic updates when we have OS permissions
      if (isOSPermissionEnabled) {
        setOptimisticEnabled(!optimisticEnabled)
      }
    },
    mutationFn: async () => {
      const isOsEnabled = isOSPermissionEnabled || (await requestOSPermissions())

      // After this point, we're guaranteed to have requested OS permissions
      // If we just obtained permissions, we want to enable notifications
      // Otherwise, we're toggling the current redux state
      const shouldEnable = isOsEnabled ? !reduxPushNotificationsEnabled : true

      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.TogglePushNotification,
          enabled: shouldEnable,
          address: props.address,
        }),
      )
      return shouldEnable
    },
    onError: (error) => {
      if (error.message === NotificationError.OsPermissionDenied) {
        // user will need to go to settings to re-enable notifications
        // when they come back, the real state will be refetched and the UI will update automatically
        showNotificationSettingsAlert()
        setOptimisticEnabled(false)
      }
    },
    onSuccess: (enabled) => {
      // setState will bail if the value is the same as the current state
      // so we can safely call it without conditionals
      setOptimisticEnabled(enabled)
      props.onPermissionChanged?.(enabled)
    },
  })

  return {
    isEnabled: optimisticEnabled,
    isPending: mutation.isPending,
    toggle: () => mutation.mutate(),
  }
}
