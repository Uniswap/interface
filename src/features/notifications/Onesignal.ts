import OneSignal from 'react-native-onesignal'
import { config } from 'src/config'
import { logger } from 'src/utils/logger'

OneSignal.setLogLevel(6, 0)
OneSignal.setAppId(config.onesignalAppId)

// TODO: import on appropriate screen in the onboarding flow
OneSignal.promptForPushNotificationsWithUserResponse((response) => {
  logger.info(
    'Onesignal',
    'promptForPushNotificationsWithUserResponse',
    `Prompt response: ${response}`
  )
})

OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
  // Complete with undefined means don't show OS notifications while app is in foreground
  notificationReceivedEvent.complete()
})

// TODO: deeplink to appropriate screen when a push notification is opened
OneSignal.setNotificationOpenedHandler((notification) => {
  logger.info('Onesignal', 'setNotificationOpenedHandler', `Notification opened: ${notification}`)
})
