import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getStatsigEnvName } from 'uniswap/src/features/gating/getStatsigEnvName'
import { StatsigOptions, getOverrideAdapter } from 'uniswap/src/features/gating/sdk/statsig'

export const statsigBaseConfig: StatsigOptions = {
  networkConfig: { api: uniswapUrls.statsigProxyUrl },
  environment: {
    tier: getStatsigEnvName(),
  },
  overrideAdapter: getOverrideAdapter(),
}
