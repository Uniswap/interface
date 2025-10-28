import { getOverrideAdapter, getStatsigEnvName, StatsigOptions } from '@universe/gating'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export const statsigBaseConfig: StatsigOptions = {
  networkConfig: { api: uniswapUrls.statsigProxyUrl },
  environment: {
    tier: getStatsigEnvName(),
  },
  overrideAdapter: getOverrideAdapter(),
}
