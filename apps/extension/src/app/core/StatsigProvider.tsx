import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { config } from 'uniswap/src/config'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { StatsigCustomAppValue } from 'uniswap/src/features/gating/constants'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { StatsigClient, StatsigUser } from 'uniswap/src/features/gating/sdk/statsig'
import { statsigBaseConfig } from 'uniswap/src/features/gating/statsigBaseConfig'
import { initializeDatadog } from 'uniswap/src/utils/datadog'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { uniqueIdQuery } from 'utilities/src/device/uniqueIdQuery'
import { logger } from 'utilities/src/logger/logger'

function makeStatsigUser(userID: string): StatsigUser {
  return {
    userID,
    appVersion: process.env.VERSION,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
  }
}

export function ExtensionStatsigProvider({
  children,
  appName,
}: {
  children: React.ReactNode
  appName: string
}): JSX.Element {
  const { data: uniqueId } = useQuery(uniqueIdQuery(), SharedQueryClient)
  const [initFinished, setInitFinished] = useState(false)
  const [user, setUser] = useState<StatsigUser>({
    userID: undefined,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
    appVersion: process.env.VERSION,
  })

  useEffect(() => {
    if (uniqueId && initFinished) {
      setUser(makeStatsigUser(uniqueId))
    }
  }, [uniqueId, initFinished])

  const onStatsigInit = (): void => {
    setInitFinished(true)
    initializeDatadog(appName).catch(() => undefined)
  }

  return (
    <StatsigProviderWrapper user={user} onInit={onStatsigInit}>
      {children}
    </StatsigProviderWrapper>
  )
}

export async function initStatSigForBrowserScripts(): Promise<void> {
  const uniqueId = await getUniqueId()
  const statsigClient = new StatsigClient(config.statsigApiKey, makeStatsigUser(uniqueId), statsigBaseConfig)
  await statsigClient.initializeAsync().catch((error) => {
    logger.error(error, {
      tags: { file: 'StatsigProvider.tsx', function: 'initStatSigForBrowserScripts' },
    })
  })
}
