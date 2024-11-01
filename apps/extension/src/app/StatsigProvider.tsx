import { useEffect, useState } from 'react'
import { initializeDatadog } from 'src/app/datadog'
import { getStatsigEnvironmentTier } from 'src/app/version'
import Statsig from 'statsig-js' // Use JS package for browser
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { DUMMY_STATSIG_SDK_KEY, StatsigCustomAppValue } from 'uniswap/src/features/gating/constants'
import { StatsigOptions, StatsigProvider, StatsigUser } from 'uniswap/src/features/gating/sdk/statsig'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
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
  const [user, setUser] = useState<StatsigUser>({
    userID: undefined,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
    appVersion: process.env.VERSION,
  })
  const [initFinished, setInitFinished] = useState(false)

  useEffect(() => {
    if (storedUser && initFinished) {
      setUser(storedUser)
    }
  }, [storedUser, initFinished])

  const options: StatsigOptions = {
    environment: {
      tier: getStatsigEnvironmentTier(),
    },
    api: uniswapUrls.statsigProxyUrl,
    disableAutoMetricsLogging: true,
    disableErrorLogging: true,
    initCompletionCallback: () => {
      setInitFinished(true)
      initializeDatadog(appName).catch(() => undefined)
    },
  }

  return (
    <StatsigProvider options={options} sdkKey={DUMMY_STATSIG_SDK_KEY} user={user} waitForInitialization={false}>
      {children}
    </StatsigProvider>
  )
}

export async function initStatSigForBrowserScripts(): Promise<void> {
  await Statsig.initialize(DUMMY_STATSIG_SDK_KEY, await getStatsigUser(), {
    api: uniswapUrls.statsigProxyUrl,
    environment: {
      tier: getStatsigEnvironmentTier(),
    },
  })
}
