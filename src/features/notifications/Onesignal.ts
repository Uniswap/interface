import { Linking } from 'react-native'
import OneSignal, { NotificationReceivedEvent, OpenedEvent } from 'react-native-onesignal'
import { config } from 'src/config'
import { logger } from 'src/utils/logger'

export const initOneSignal = (): void => {
  OneSignal.setLogLevel(6, 0)
  OneSignal.setAppId(config.onesignalAppId)

  OneSignal.setNotificationWillShowInForegroundHandler((event: NotificationReceivedEvent) => {
    // Complete with undefined means don't show OS notifications while app is in foreground
    event.complete()
  })

  OneSignal.setNotificationOpenedHandler((event: OpenedEvent) => {
    logger.debug(
      'Onesignal',
      'setNotificationOpenedHandler',
      `Notification opened: ${event.notification}`
    )

    // This emits a url event when coldStart = false. Don't call openURI because that will
    // send the user to Safari to open the universal link. When coldStart = true, OneSignal
    // handles the url event and navigates correctly.
    if (event.notification.launchURL) {
      Linking.emit('url', { url: event.notification.launchURL })
    }
  })
}

export const promptPushPermission = (
  successCallback?: () => void,
  failureCallback?: () => void
): void => {
  OneSignal.promptForPushNotificationsWithUserResponse((response) => {
    logger.debug(
      'Onesignal',
      'promptForPushNotificationsWithUserResponse',
      `Prompt response: ${response}`
    )
    if (response) {
      successCallback?.()
    } else {
      failureCallback?.()
    }
  })
}
