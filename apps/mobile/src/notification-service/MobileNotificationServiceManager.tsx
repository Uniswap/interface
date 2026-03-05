import { useQuery } from '@tanstack/react-query'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { getIsNotificationServiceLocalOverrideEnabled } from '@universe/notifications'
import React, { useEffect } from 'react'
import { getNotificationServiceQueryOptions } from 'src/notification-service/MobileNotificationService'
import { NotificationContainer } from 'src/notification-service/notification-renderer/NotificationContainer'
import { getLogger } from 'utilities/src/logger/logger'

/**
 * Manages the lifecycle of the notification service on mobile.
 *
 * This component:
 * - Creates the notification service via React Query
 * - Initializes the service on mount
 * - Destroys the service on unmount
 * - Renders the NotificationContainer for displaying notifications
 *
 * Usage:
 * Replace the legacy OnboardingIntroCardStack with this component in HomeScreen
 * when the NotificationService feature flag is enabled.
 */
export function MobileNotificationServiceManager(): React.JSX.Element | null {
  const isNotificationServiceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationService)
  const isNotificationServiceEnabled =
    getIsNotificationServiceLocalOverrideEnabled() || isNotificationServiceEnabledFlag
  const isApiDataSourceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationApiDataSource)

  const { data: notificationService } = useQuery(
    getNotificationServiceQueryOptions({
      getIsEnabled: () => isNotificationServiceEnabled,
      getIsApiDataSourceEnabled: () => isApiDataSourceEnabledFlag,
    }),
  )

  useEffect(() => {
    if (!notificationService) {
      return undefined
    }

    notificationService.initialize().catch((error) => {
      getLogger().error(error, {
        tags: { file: 'MobileNotificationServiceManager', function: 'initialize' },
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
