import { getIosPushNotificationServiceEnvironmentAsync } from 'expo-application'
import { config } from 'src/config'
import { getOnesignalPushTokenOrError } from 'src/features/notifications/Onesignal'
import { logger } from 'src/utils/logger'

// TODO: [MOB-3915] Change to production server endpoint for push server, currently using test endpoints
const WC_PUSH_SERVER_BASE_URL = 'https://us-central1-uniswap-mobile.cloudfunctions.net'
const WC_REGISTER_ENDPOINT = 'onWalletConnectRegistration'
const WC_DEREGISTER_ENDPOINT = 'onWalletConnectDeregistration'

const WCV2_HOSTED_PUSH_SERVER_URL = `https://echo.walletconnect.com/${config.walletConnectProjectId}`

export type RegisterWcPushNotificationParams = {
  bridge: string
  topic: string
  address: string
  peerName: string
  language: string
}

export type DeregisterWcPushNotificationParams = {
  topic: string
}

export async function registerWcPushNotifications(
  params: RegisterWcPushNotificationParams
): Promise<void> {
  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }

  try {
    await fetch(`${WC_PUSH_SERVER_BASE_URL}/${WC_REGISTER_ENDPOINT}`, request)
  } catch (error) {
    logger.debug(
      'walletConnectApi',
      'registerWcPushNotifications',
      `Error registering session ${params.topic} for WalletConnect Push Notifications`,
      error
    )
  }
}

export async function deregisterWcPushNotifications(
  params: DeregisterWcPushNotificationParams
): Promise<void> {
  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }
  try {
    await fetch(`${WC_PUSH_SERVER_BASE_URL}/${WC_DEREGISTER_ENDPOINT}`, request)
  } catch (error) {
    logger.debug(
      'walletConnectApi',
      'deregisterWcPushNotifications',
      `Error deregistering session ${params.topic} for WalletConnect Push Notifications`,
      error
    )
  }
}

/**
 * Registers client and device push token with hosted WalletConnect 2.0 Echo Server.
 * The echo server listens to incoming signing requests and delivers push notifications via APNS.
 * See https://docs.walletconnect.com/2.0/specs/servers/echo/spec
 *
 * @param clientId WalletConnect 2.0 clientId
 */
export async function registerWCv2ClientForPushNotifications(clientId: string): Promise<void> {
  const pushToken = await getOnesignalPushTokenOrError()
  const apnsEnvironment = await getIosPushNotificationServiceEnvironmentAsync()
  const type = apnsEnvironment === 'production' ? 'apns' : 'apns-sandbox'

  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      type,
      token: pushToken,
    }),
  }

  try {
    await fetch(`${WCV2_HOSTED_PUSH_SERVER_URL}/clients`, request)
  } catch (error) {
    logger.warn(
      'walletConnectApi',
      'registerWCv2ClientForPushNotifications',
      `Error registering client for WalletConnect 2.0 Push Notifications`,
      error
    )
  }
}
