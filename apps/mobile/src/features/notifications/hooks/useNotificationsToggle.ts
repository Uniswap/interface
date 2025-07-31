import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NotifSettingType } from 'src/features/notifications/constants'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { usePromptPushPermission } from 'src/features/notifications/hooks/usePromptPushPermission'
import { selectAllPushNotificationSettings } from 'src/features/notifications/selectors'
import { showNotificationSettingsAlert } from 'src/features/notifications/showNotificationSettingsAlert'
import { updateNotifSettings } from 'src/features/notifications/slice'
import { waitFrame } from 'utilities/src/react/delayUtils'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useSelectAccountNotificationSetting } from 'wallet/src/features/wallet/hooks'

enum NotificationError {
  OsPermissionDenied = 'OS_PERMISSION_DENIED',
}

export function useAddressNotificationToggle({
  address,
  onToggle,
}: {
  address: string
  onToggle?: (enabled: boolean) => void
}): ReturnType<typeof useBaseNotificationToggle> {
  const dispatch = useDispatch()
  const isAppPermissionEnabled = useSelectAccountNotificationSetting(address)

  const handleToggle = useCallback(
    (enabled: boolean) => {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.TogglePushNotification,
          enabled,
          address,
        }),
      )
      onToggle?.(enabled)
    },
    [address, dispatch, onToggle],
  )

  return useBaseNotificationToggle({ isAppPermissionEnabled, onToggle: handleToggle })
}

export function useSettingNotificationToggle({
  type,
  onToggle,
}: {
  type: NotifSettingType
  onToggle?: (enabled: boolean) => void
}): ReturnType<typeof useBaseNotificationToggle> {
  const dispatch = useDispatch()
  const { generalUpdatesEnabled } = useSelector(selectAllPushNotificationSettings)

  const permissionEnabledMap: Record<NotifSettingType, boolean> = {
    [NotifSettingType.GeneralUpdates]: generalUpdatesEnabled,
  }
  const isAppPermissionEnabled = permissionEnabledMap[type]

  const handleToggle = useCallback(
    (enabled: boolean) => {
      dispatch(updateNotifSettings({ [type]: enabled }))
      onToggle?.(enabled)
    },
    [dispatch, onToggle, type],
  )

  return useBaseNotificationToggle({ isAppPermissionEnabled, onToggle: handleToggle })
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

function useBaseNotificationToggle({
  isAppPermissionEnabled,
  onToggle,
}: {
  isAppPermissionEnabled: boolean
  onToggle: (enabled: boolean) => void
}): {
  isEnabled: boolean
  isPending: boolean
  toggle: () => void
} {
  // Get real states from different systems
  const { notificationPermissionsEnabled: osPermissionStatus } = useNotificationOSPermissionsEnabled()
  const isOSPermissionEnabled = osPermissionStatus === NotificationPermission.Enabled

  // Derive real enabled state - only true if both systems are enabled
  const isEnabled = isOSPermissionEnabled && isAppPermissionEnabled

  // Optimistic UI state
  const [optimisticEnabled, setOptimisticEnabled] = useState<boolean>(isEnabled)
  const promptPushPermission = usePromptPushPermission()
  // Helper to handle OS permission request and state update
  const requestOSPermissions = useCallback(async (): Promise<true> => {
    const granted = await promptPushPermission()
    if (!granted) {
      // Keep app permissions enabled for when OS permissions are restored
      onToggle(true)
      // this means the user denied the permission at the system level
      // and needs to go to settings to re-enable (boo)
      throw new Error(NotificationError.OsPermissionDenied)
    }
    return true
  }, [onToggle, promptPushPermission])

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
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const shouldEnable = isOsEnabled ? !isAppPermissionEnabled : true
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
      onToggle(enabled)
    },
  })

  return {
    isEnabled: optimisticEnabled,
    isPending: mutation.isPending,
    toggle: () => mutation.mutate(),
  }
}
