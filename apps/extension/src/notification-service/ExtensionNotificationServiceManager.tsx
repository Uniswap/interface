import { useQuery } from '@tanstack/react-query'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { getIsNotificationServiceLocalOverrideEnabled } from '@universe/notifications'
import React, { useEffect } from 'react'
import { navigate } from 'src/app/navigation/state'
import { getNotificationServiceQueryOptions } from 'src/notification-service/ExtensionNotificationService'
import { NotificationContainer } from 'src/notification-service/notification-renderer/NotificationContainer'
import { getReduxStore } from 'src/store/store'
import { getLogger } from 'utilities/src/logger/logger'

/**
 * Manages the lifecycle of the notification service in the extension.
 */
export function ExtensionNotificationServiceManager(): React.JSX.Element | null {
  const isNotificationServiceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationService)
  const isNotificationServiceEnabled =
    getIsNotificationServiceLocalOverrideEnabled() || isNotificationServiceEnabledFlag
  const isApiDataSourceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationApiDataSource)

  const { data: notificationService } = useQuery(
    getNotificationServiceQueryOptions({
      navigate: (path: string) => navigate({ pathname: path }),
      getIsEnabled: () => isNotificationServiceEnabled,
      getIsApiDataSourceEnabled: () => isApiDataSourceEnabledFlag,
      getReduxStore: () => getReduxStore(),
    }),
  )

  useEffect(() => {
    if (!notificationService) {
      return undefined
    }

    notificationService.initialize().catch((error) => {
      getLogger().error(error, {
        tags: { file: 'ExtensionNotificationServiceManager', function: 'initialize' },
        extra: { message: 'Failed to initialize notification service' },
      })
    })

    return () => {
      notificationService.destroy()
    }
  }, [notificationService])

  if (!isNotificationServiceEnabled || !notificationService) {
    return null
  }

  return (
    <NotificationContainer
      onRenderFailed={notificationService.onRenderFailed}
      onNotificationClick={notificationService.onNotificationClick}
      onNotificationShown={notificationService.onNotificationShown}
    />
  )
}
