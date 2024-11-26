import { Linking } from 'react-native'
import OneSignal, { NotificationReceivedEvent, OpenedEvent } from 'react-native-onesignal'
import { config } from 'uniswap/src/config'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { apolloClientRef } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE } from 'wallet/src/features/transactions/TransactionHistoryUpdater'

export const initOneSignal = (): void => {
  OneSignal.setAppId(config.onesignalAppId)

  OneSignal.setNotificationWillShowInForegroundHandler((event: NotificationReceivedEvent) => {
    // Complete with undefined means don't show OS notifications while app is in foreground
    event.complete()
  })

  OneSignal.setNotificationOpenedHandler((event: OpenedEvent) => {
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
}

export const promptPushPermission = (successCallback?: () => void, failureCallback?: () => void): void => {
  OneSignal.promptForPushNotificationsWithUserResponse((response) => {
    logger.debug('Onesignal', 'promptForPushNotificationsWithUserResponse', `Prompt response: ${response}`)
    if (response) {
      successCallback?.()
    } else {
      failureCallback?.()
    }
  })
}

export const getOneSignalUserIdOrError = async (): Promise<string> => {
  const onesignalUserId = (await OneSignal.getDeviceState())?.userId
  if (!onesignalUserId) {
    throw new Error('Onesignal user ID is not defined')
  }
  return onesignalUserId
}

export const getOneSignalPushToken = async (): Promise<string | undefined> => {
  const onesignalPushToken = (await OneSignal.getDeviceState())?.pushToken
  return onesignalPushToken
}
