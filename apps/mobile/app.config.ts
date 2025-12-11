import { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Uniswap',
  slug: 'uniswapmobile',
  scheme: 'uniswap',
  owner: 'uniswap',
  extra: {
    eas: {
      projectId: 'f1be3813-43d7-49ac-a792-7f42cf8500f5',
    },
  },
  experiments: {
    buildCacheProvider: 'eas',
  },
}

export default config
