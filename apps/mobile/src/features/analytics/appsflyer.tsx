import appsFlyer from 'react-native-appsflyer'
import { isBetaBuild, isDevBuild } from 'src/utils/version'
import { config } from 'wallet/src/config'
import { logger } from 'wallet/src/features/logger/logger'

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
      logger.error('appsflyer', 'initAppsFlyer', 'Error:', error)
    }
  )
}
