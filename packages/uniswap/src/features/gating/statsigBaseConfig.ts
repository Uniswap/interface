import { getOverrideAdapter, getStatsigEnvName, StatsigOptions } from '@universe/gating'
import { uniswapUrls } from 'uniswap/src/constants/urls'

// HKSWAP: Disabled Statsig - use dummy config
export const statsigBaseConfig: StatsigOptions = {
  // networkConfig: { api: uniswapUrls.statsigProxyUrl },
  networkConfig: { api: 'https://dummy-statsig-proxy.hkswap.local/v1/statsig-proxy' }, // HKSWAP: Dummy URL since Statsig is disabled
  environment: {
    tier: getStatsigEnvName(),
  },
  overrideAdapter: getOverrideAdapter(),
}
