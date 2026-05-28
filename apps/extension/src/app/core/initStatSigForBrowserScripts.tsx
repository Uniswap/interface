import { StatsigClient, StatsigCustomAppValue, StatsigUser } from '@universe/gating'
import { getConfig } from 'src/app/config'
import { statsigBaseConfig } from 'uniswap/src/features/gating/statsigBaseConfig'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { logger } from 'utilities/src/logger/logger'

export function makeStatsigUser(userID: string): StatsigUser {
  return {
    userID,
    appVersion: getConfig().appVersion,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
  }
}

export async function initStatSigForBrowserScripts(): Promise<void> {
  const uniqueId = await getUniqueId()
  const statsigClient = new StatsigClient(getConfig().statsigApiKey, makeStatsigUser(uniqueId), statsigBaseConfig)
  await statsigClient.initializeAsync().catch((error) => {
    logger.error(error, {
      tags: { file: 'initStatSigForBrowserScripts.tsx', function: 'initStatSigForBrowserScripts' },
    })
  })
}
