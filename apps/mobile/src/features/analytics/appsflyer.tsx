import appsFlyer from 'react-native-appsflyer'
import { isBetaBuild, isDevBuild } from 'src/utils/version'
import { config } from 'wallet/src/config'
import { logger } from 'wallet/src/features/logger/logger'
import serializeError from 'wallet/src/utils/serializeError'

export function initAppsFlyer(): void {
  appsFlyer.initSdk(
    {
      devKey: config.appsflyerApiKey,
      isDebug: isDevBuild() || isBetaBuild(),
      appId: config.appsflyerAppId,
      onInstallConversionDataListener: false,
      onDeepLinkListener: false,
      timeToWaitForATTUserAuthorization: 10,
    },
    (result) => {
      logger.debug('appsflyer', 'initAppsFlyer', 'Result:', result)
    },
    (error) => {
      logger.error('Unable to init AppsFlyer', {
        tags: {
          file: 'appsflyer',
          function: 'initAppsFlyer',
          error: serializeError(error),
        },
      })
    }
  )
}
