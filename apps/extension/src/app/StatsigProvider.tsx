import { getLocalUserId } from 'src/app/utils/storage'
import { getStatsigEnvironmentTier } from 'src/app/version'
import Statsig from 'statsig-js' // Use JS package for browser
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { DUMMY_STATSIG_SDK_KEY, StatsigCustomAppValue } from 'uniswap/src/features/gating/constants'
import { StatsigOptions, StatsigProvider, StatsigUser } from 'uniswap/src/features/gating/sdk/statsig'
import { useAsyncData } from 'utilities/src/react/hooks'

async function getStatsigUser(): Promise<StatsigUser> {
  return {
    userID: await getLocalUserId(),
    appVersion: process.env.VERSION,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
  }
}

export function ExtensionStatsigProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const { data: user } = useAsyncData(getStatsigUser)

  const nonNullUser: StatsigUser = user ?? {
    userID: undefined,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
    appVersion: process.env.VERSION,
  }

  const options: StatsigOptions = {
    environment: {
      tier: getStatsigEnvironmentTier(),
    },
    api: uniswapUrls.statsigProxyUrl,
    disableAutoMetricsLogging: true,
    disableErrorLogging: true,
  }

  return (
    <StatsigProvider options={options} sdkKey={DUMMY_STATSIG_SDK_KEY} user={nonNullUser} waitForInitialization={false}>
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
