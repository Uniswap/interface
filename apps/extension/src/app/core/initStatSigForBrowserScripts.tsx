import { config } from 'uniswap/src/config'
import { StatsigCustomAppValue } from 'uniswap/src/features/gating/constants'
import { StatsigClient, StatsigUser } from 'uniswap/src/features/gating/sdk/statsig'
import { statsigBaseConfig } from 'uniswap/src/features/gating/statsigBaseConfig'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { logger } from 'utilities/src/logger/logger'

export function makeStatsigUser(userID: string): StatsigUser {
  return {
    userID,
    appVersion: process.env.VERSION,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
  }
}

export async function initStatSigForBrowserScripts(): Promise<void> {
  const uniqueId = await getUniqueId()
  const statsigClient = new StatsigClient(config.statsigApiKey, makeStatsigUser(uniqueId), statsigBaseConfig)
  await statsigClient.initializeAsync().catch((error) => {
    logger.error(error, {
      tags: { file: 'initStatSigForBrowserScripts.tsx', function: 'initStatSigForBrowserScripts' },
    })
  })
}
