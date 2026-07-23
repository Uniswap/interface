import { getOverrideAdapter, getStatsigEnvName, StatsigOptions } from '@universe/gating'
import { config } from 'uniswap/src/config'
import { getUniswapServiceUrls } from 'uniswap/src/constants/urls'

export const statsigBaseConfig: StatsigOptions = {
  networkConfig: { api: getUniswapServiceUrls(config).statsigProxyUrl },
  environment: {
    tier: getStatsigEnvName(),
  },
  overrideAdapter: getOverrideAdapter(),
}
