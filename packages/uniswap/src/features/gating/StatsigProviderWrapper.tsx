import { ReactNode, useEffect } from 'react'
import { config } from 'uniswap/src/config'
import {
  StatsigOptions,
  StatsigProvider,
  StatsigUser,
  StorageProvider,
  useClientAsyncInit,
} from 'uniswap/src/features/gating/sdk/statsig'
import { statsigBaseConfig } from 'uniswap/src/features/gating/statsigBaseConfig'

type StatsigProviderWrapperProps = {
  user: StatsigUser
  children: ReactNode
  onInit?: () => void
  options?: Partial<StatsigUser>
  storageProvider?: StorageProvider
}

export function StatsigProviderWrapper({
  children,
  options,
  user,
  storageProvider,
  onInit,
}: StatsigProviderWrapperProps): ReactNode {
  if (!config.statsigApiKey) {
    throw new Error('statsigApiKey is not set')
  }

  const statsigOptions: StatsigOptions = {
    ...statsigBaseConfig,
    storageProvider,
    ...options,
  }

  const { client, isLoading: isStatsigLoading } = useClientAsyncInit(config.statsigApiKey, user, statsigOptions)

  useEffect(() => {
    if (isStatsigLoading) {
      return
    }

    onInit?.()
  }, [isStatsigLoading, onInit])

  return <StatsigProvider client={client}>{children}</StatsigProvider>
}
