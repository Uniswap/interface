import appsFlyer from 'react-native-appsflyer'
import { config } from 'uniswap/src/config'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'

export function initAppsFlyer(): void {
  appsFlyer.initSdk(
    {
      devKey: config.appsflyerApiKey,
      isDebug: isDevEnv() || isBetaEnv(),
      appId: config.appsflyerAppId,
      onInstallConversionDataListener: false,
      onDeepLinkListener: false,
      timeToWaitForATTUserAuthorization: 10,
      // Ensures we have to manually start the SDK to respect any opting out
      manualStart: true,
    },
    (result) => {
      logger.debug('appsflyer', 'initAppsFlyer', 'Result:', result)
    },
    (error) => {
      logger.error(error, { tags: { file: 'appsflyer', function: 'initAppsFlyer' } })
    },
  )
}
