import { useFocusEffect } from '@react-navigation/core'
import { useState } from 'react'
import { checkNotifications } from 'react-native-permissions'
import { useAppSelector } from 'src/app/hooks'
import { makeSelectAddressNotificationCount } from 'src/features/notifications/selectors'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'

export enum NotificationPermission {
  Enabled = 'enabled',
  Disabled = 'disabled',
  Loading = 'loading',
}

export function useSelectAddressNotificationCount(address: Address | null) {
  return useAppSelector(makeSelectAddressNotificationCount(address))
}

export function useNotificationOSPermissionsEnabled() {
  const [notificationPermissionsEnabled, setNotificationPermissionsEnabled] =
    useState<NotificationPermission>(NotificationPermission.Loading)
  useFocusEffect(() => {
    const checkNotificationPermissions = async () => {
      const { status } = await checkNotifications()
      const permission =
        status === 'granted' ? NotificationPermission.Enabled : NotificationPermission.Disabled
      setNotificationPermissionsEnabled(permission)
    }
    checkNotificationPermissions()
  })

  useAppStateTrigger('background', 'active', () => {
    const checkNotificationPermissions = async () => {
      const { status } = await checkNotifications()
      const permission =
        status === 'granted' ? NotificationPermission.Enabled : NotificationPermission.Disabled
      setNotificationPermissionsEnabled(permission)
    }
    checkNotificationPermissions()
  })

  return notificationPermissionsEnabled
}
