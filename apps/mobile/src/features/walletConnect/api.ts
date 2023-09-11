import { getIosPushNotificationServiceEnvironmentAsync } from 'expo-application'
import { getOnesignalPushTokenOrError } from 'src/features/notifications/Onesignal'
import { logger } from 'utilities/src/logger/logger'
import { config } from 'wallet/src/config'

const WC_HOSTED_PUSH_SERVER_URL = `https://echo.walletconnect.com/${config.walletConnectProjectId}`

/**
 * Registers client and device push token with hosted WalletConnect 2.0 Echo Server.
 * The echo server listens to incoming signing requests and delivers push notifications via APNS.
 * See https://docs.walletconnect.com/2.0/specs/servers/echo/spec
 *
 * @param clientId WalletConnect 2.0 clientId
 */
export async function registerWCClientForPushNotifications(clientId: string): Promise<void> {
  try {
    const pushToken = await getOnesignalPushTokenOrError()
    const apnsEnvironment = await getIosPushNotificationServiceEnvironmentAsync()

    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        type: apnsEnvironment === 'production' ? 'apns' : 'apns-sandbox',
        token: pushToken,
      }),
    }

    await fetch(`${WC_HOSTED_PUSH_SERVER_URL}/clients`, request)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'walletConnectApi', function: 'registerWCv2ClientForPushNotifications' },
    })
  }
}
