import { bootstrapStatsigClient, StatsigCustomAppValue, type StatsigUser, Storage } from '@universe/gating'
import { getUniqueIdSync } from 'react-native-device-info'
import { statsigMMKVStorageProvider } from 'src/features/statsig/statsigMMKVStorageProvider'
import { statsigBaseConfig } from 'uniswap/src/features/gating/statsigBaseConfig'

// Register a Statsig client before redux-saga starts so pre-React feature-flag
// reads find a real client. Mirrors the user/options shape from App.tsx.
// Initialization is left to the React provider.
Storage._setProvider(statsigMMKVStorageProvider)

const user: StatsigUser = {
  userID: getUniqueIdSync(),
  custom: {
    app: StatsigCustomAppValue.Mobile,
  },
}

bootstrapStatsigClient(user, {
  ...statsigBaseConfig,
  storageProvider: statsigMMKVStorageProvider,
})
