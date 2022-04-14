import OneSignal, { OpenedEvent } from 'react-native-onesignal'
import { config } from 'src/config'
import { openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

interface NotificationAttachments {
  app_url?: string
}

export const initOneSignal = () => {
  OneSignal.setLogLevel(6, 0)
  OneSignal.setAppId(config.onesignalAppId)

  // TODO: figure out which account this notif is referring to, if it's the non-active account then
  // apply visual cues (e.g., notifcation badge)
  OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
    // Complete with undefined means don't show OS notifications while app is in foreground
    notificationReceivedEvent.complete()
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

export const promptPushPermission = () => {
  OneSignal.promptForPushNotificationsWithUserResponse((response) => {
    logger.info(
      'Onesignal',
      'promptForPushNotificationsWithUserResponse',
      `Prompt response: ${response}`
    )
  })
}
