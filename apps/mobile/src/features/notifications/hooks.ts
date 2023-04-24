import { useFocusEffect } from '@react-navigation/core'
import { useState } from 'react'
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
  return useAppSelector(makeSelectHasNotifications(address))
}

export function useNotificationOSPermissionsEnabled(): NotificationPermission {
  const [notificationPermissionsEnabled, setNotificationPermissionsEnabled] =
    useState<NotificationPermission>(NotificationPermission.Loading)
  useFocusEffect(() => {
    const checkNotificationPermissions = async (): Promise<void> => {
      const { status } = await checkNotifications()
      const permission =
        status === 'granted' ? NotificationPermission.Enabled : NotificationPermission.Disabled
      setNotificationPermissionsEnabled(permission)
    }
    checkNotificationPermissions()
  })

  useAppStateTrigger('background', 'active', () => {
    const checkNotificationPermissions = async (): Promise<void> => {
      const { status } = await checkNotifications()
      const permission =
        status === 'granted' ? NotificationPermission.Enabled : NotificationPermission.Disabled
      setNotificationPermissionsEnabled(permission)
    }
    checkNotificationPermissions()
  })

  return notificationPermissionsEnabled
}
