import { useEffect, useState } from 'react'
import { config } from 'uniswap/src/config'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { StatsigCustomAppValue } from 'uniswap/src/features/gating/constants'
import { StatsigClient, StatsigUser } from 'uniswap/src/features/gating/sdk/statsig'
import { statsigBaseConfig } from 'uniswap/src/features/gating/statsigBaseConfig'
import { initializeDatadog } from 'uniswap/src/utils/datadog'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'

async function getStatsigUser(): Promise<StatsigUser> {
  return {
    userID: await getUniqueId(),
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
  const { data: storedUser } = useAsyncData(getStatsigUser)
  const [initFinished, setInitFinished] = useState(false)
  const [user, setUser] = useState<StatsigUser>({
    userID: undefined,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
    appVersion: process.env.VERSION,
  })

  useEffect(() => {
    if (storedUser && initFinished) {
      setUser(storedUser)
    }
  }, [storedUser, initFinished])

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
  const statsigClient = new StatsigClient(config.statsigApiKey, await getStatsigUser(), statsigBaseConfig)
  await statsigClient.initializeAsync().catch((error) => {
    logger.error(error, {
      tags: { file: 'StatsigProvider.tsx', function: 'initStatSigForBrowserScripts' },
    })
  })
}
