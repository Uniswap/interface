import { Linking } from 'react-native'
import { OneSignal } from 'react-native-onesignal'
import { NotificationType } from 'src/features/notifications/constants'
import { config } from 'uniswap/src/config'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE } from 'uniswap/src/features/portfolio/portfolioUpdates/constants'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'
import { isIOS } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { apolloClientRef } from 'wallet/src/data/apollo/usePersistedApolloClient'

export const initOneSignal = (): void => {
  // Uncomment for local debugging
  // OneSignal.Debug.setLogLevel(LogLevel.Verbose)

  OneSignal.initialize(config.onesignalAppId)

  OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
    const notification = event.getNotification()
    const additionalData = notification.additionalData as { notification_type?: string }
    const notificationType = additionalData?.notification_type

    let enabled = false
    // Some special notif filtering logic is needed for iOS
    if (isIOS) {
      switch (notificationType) {
        case NotificationType.UnfundedWalletReminder:
          enabled = getFeatureFlagWithExposureLoggingDisabled(FeatureFlags.NotificationPriceAlertsIOS)
          break
        case NotificationType.PriceAlert:
          enabled = getFeatureFlagWithExposureLoggingDisabled(FeatureFlags.NotificationPriceAlertsIOS)
          break
        default:
          enabled = false
      }
    } else {
      if (
        notificationType === NotificationType.UnfundedWalletReminder ||
        notificationType === NotificationType.PriceAlert
      ) {
        enabled = true
      }
    }

    if (!enabled) {
      // Prevent default will avoid showing OS notifications while app is in foreground
      event.preventDefault()
    }
  })

  OneSignal.Notifications.addEventListener('click', (event) => {
    logger.debug('Onesignal', 'setNotificationOpenedHandler', `Notification opened: ${event.notification}`)

    setTimeout(
      () =>
        apolloClientRef.current?.refetchQueries({
          include: GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE,
        }),
      ONE_SECOND_MS, // Delay by 1s to give a buffer for data sources to synchronize
    )

    // This emits a url event when coldStart = false. Don't call openURI because that will
    // send the user to Safari to open the universal link. When coldStart = true, OneSignal
    // handles the url event and navigates correctly.
    if (event.notification.launchURL) {
      Linking.emit('url', { url: event.notification.launchURL })
    }
  })

  getUniqueId()
    .then((deviceId) => {
      if (deviceId) {
        OneSignal.login(deviceId)
      }
    })
    .catch(() =>
      logger.error('Failed to get device ID for OneSignal', {
        tags: {
          file: 'Onesignal.ts',
          function: 'initOneSignal',
        },
      }),
    )
}

export const promptPushPermission = async (): Promise<boolean> => {
  const response = await OneSignal.Notifications.requestPermission(true)
  logger.debug('Onesignal', 'promptForPushNotificationsWithUserResponse', `Prompt response: ${response}`)
  return response
}

export const getOneSignalUserIdOrError = async (): Promise<string> => {
  const onesignalUserId = await OneSignal.User.getOnesignalId()
  if (!onesignalUserId) {
    throw new Error('Onesignal user ID is not defined')
  }
  return onesignalUserId
}

export const getOneSignalPushToken = async (): Promise<string | null> => {
  const onesignalPushToken = await OneSignal.User.pushSubscription.getTokenAsync()
  return onesignalPushToken
}
