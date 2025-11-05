import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants/wallet'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'

const EVENT_NAME = 'SilentPushReceived'

interface SilentPushEventEmitterInterface {
  addListener: (eventName: string) => void
  removeListeners: (count: number) => void
}

declare module 'react-native' {
  interface NativeModulesStatic {
    SilentPushEventEmitter: SilentPushEventEmitterInterface
  }
}

const { SilentPushEventEmitter } = NativeModules

const eventEmitter = isMobileApp ? new NativeEventEmitter(SilentPushEventEmitter) : undefined

let subscription: { remove: () => void } | undefined

const handleSilentPush = (payload: Record<string, unknown>): void => {
  logger.debug('SilentPush', 'handleSilentPush', 'Silent push received', payload)

  // Onesignal Silent Push payload stores the template id in the 'custom' object with key 'i'
  if ('custom' in payload && payload.custom) {
    try {
      const customPayload = typeof payload.custom === 'string' ? JSON.parse(payload.custom) : payload.custom

      if (!('i' in customPayload) || typeof customPayload.i !== 'string') {
        return
      }

      sendAnalyticsEvent(WalletEventName.SilentPushReceived, {
        template_id: customPayload.i,
      })
      logger.debug('SilentPush', 'handleSilentPush', 'Silent push event sent', {
        template_id: customPayload.i,
      })
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'SilentPushListener.ts',
          function: 'handleSilentPush',
        },
      })
    }
  }
}

export const startSilentPushListener = (): void => {
  if (subscription) {
    return
  }

  if (!eventEmitter) {
    logger.warn('SilentPush', 'startSilentPushListener', 'Native event emitter unavailable', {
      platform: Platform.OS,
      moduleLoaded: Boolean(SilentPushEventEmitter),
    })
    return
  }

  subscription = eventEmitter.addListener(EVENT_NAME, handleSilentPush)
  logger.debug('SilentPush', 'startSilentPushListener', 'Listener registered')
}
