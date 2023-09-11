import appsFlyer from 'react-native-appsflyer'
import { isBetaBuild, isDevBuild } from 'src/utils/version'
import { logger } from 'utilities/src/logger/logger'
import { config } from 'wallet/src/config'

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
      logger.error(error, { tags: { file: 'appsflyer', function: 'initAppsFlyer' } })
    }
  )
}
