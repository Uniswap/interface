import OneSignal, { NotificationReceivedEvent, OpenedEvent } from 'react-native-onesignal'
import { config } from 'src/config'
import { openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

interface NotificationAttachments {
  app_url?: string
  data?: {
    address?: Address
  }
}

export const initOneSignal = () => {
  OneSignal.setLogLevel(6, 0)
  OneSignal.setAppId(config.onesignalAppId)

  OneSignal.setNotificationWillShowInForegroundHandler((event: NotificationReceivedEvent) => {
    // Complete with undefined means don't show OS notifications while app is in foreground
    event.complete()
  })

  OneSignal.setNotificationOpenedHandler((event: OpenedEvent) => {
    logger.info(
      'Onesignal',
      'setNotificationOpenedHandler',
      `Notification opened: ${event.notification}`
    )

    const url = (event.notification?.attachments as NotificationAttachments)?.app_url
    if (url) openUri(url)
  })
}

export const promptPushPermission = (successCallback?: () => void) => {
  OneSignal.promptForPushNotificationsWithUserResponse((response) => {
    logger.info(
      'Onesignal',
      'promptForPushNotificationsWithUserResponse',
      `Prompt response: ${response}`
    )
    if (response) {
      successCallback?.()
    }
  })
}
