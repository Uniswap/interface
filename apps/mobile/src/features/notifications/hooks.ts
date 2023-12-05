import { useFocusEffect } from '@react-navigation/core'
import { useMemo, useState } from 'react'
import { checkNotifications } from 'react-native-permissions'
import { useAppSelector } from 'src/app/hooks'
import { makeSelectHasNotifications } from 'src/features/notifications/selectors'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'

export enum NotificationPermission {
  Enabled = 'enabled',
  Disabled = 'disabled',
  Loading = 'loading',
}

export function useSelectAddressHasNotifications(address: Address | null): boolean | undefined {
  const selectHasNotifications = useMemo(makeSelectHasNotifications, [])
  return useAppSelector((state) => selectHasNotifications(state, address))
}

export function useNotificationOSPermissionsEnabled(): NotificationPermission {
  const [notificationPermissionsEnabled, setNotificationPermissionsEnabled] =
    useState<NotificationPermission>(NotificationPermission.Loading)

  const checkNotificationPermissions = async (): Promise<void> => {
    const { status } = await checkNotifications()
    const permission =
      status === 'granted' ? NotificationPermission.Enabled : NotificationPermission.Disabled
    setNotificationPermissionsEnabled(permission)
  }

  useFocusEffect(() => {
    checkNotificationPermissions().catch(() => undefined)
  })

  useAppStateTrigger('background', 'active', checkNotificationPermissions)

  return notificationPermissionsEnabled
}
