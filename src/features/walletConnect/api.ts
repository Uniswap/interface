import { logger } from 'src/utils/logger'

// TODO: [MOB-3915] Change to production server endpoint for push server, currently using test endpoints
const WC_PUSH_SERVER_BASE_URL = 'https://us-central1-uniswap-mobile.cloudfunctions.net'
const WC_REGISTER_ENDPOINT = 'onWalletConnectRegistration'
const WC_DEREGISTER_ENDPOINT = 'onWalletConnectDeregistration'

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
