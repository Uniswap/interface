import appsFlyer from 'react-native-appsflyer'
import { isBetaBuild, isDevBuild } from 'src/utils/version'
import { config } from 'uniswap/src/config'
import { logger } from 'utilities/src/logger/logger'

export function initAppsFlyer(): void {
  appsFlyer.initSdk(
    {
      devKey: config.appsflyerApiKey,
      isDebug: isDevBuild() || isBetaBuild(),
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
    }
  )
}
