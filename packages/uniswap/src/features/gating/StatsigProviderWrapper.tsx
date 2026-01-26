import {
  type StatsigOptions,
  StatsigProvider,
  type StatsigUser,
  type StorageProvider,
  useClientAsyncInit,
  StatsigClient,
} from '@universe/gating'
import { type ReactNode, useEffect, useMemo } from 'react'
import { config } from 'uniswap/src/config'
import { statsigBaseConfig } from 'uniswap/src/features/gating/statsigBaseConfig'
import { logger } from 'utilities/src/logger/logger'

type StatsigProviderWrapperProps = {
  user: StatsigUser
  children: ReactNode
  onInit?: () => void
  options?: Partial<StatsigUser>
  storageProvider?: StorageProvider
}

// HKSWAP: Disabled Statsig feature flags - not needed for hkswap
export function StatsigProviderWrapper({
  children,
  options,
  user,
  storageProvider,
  onInit,
}: StatsigProviderWrapperProps): ReactNode {
  // if (!config.statsigApiKey) {
  //   throw new Error('statsigApiKey is not set')
  // }

  // const statsigOptions = useMemo<StatsigOptions>(
  //   () => ({
  //     ...statsigBaseConfig,
  //     storageProvider,
  //     ...options,
  //   }),
  //   [storageProvider, options],
  // )

  // const { client, isLoading: isStatsigLoading } = useClientAsyncInit(config.statsigApiKey, user, statsigOptions)

  // useEffect(() => {
  //   if (isStatsigLoading) {
  //     return
  //   }

  //   onInit?.()
  // }, [isStatsigLoading, onInit])

  // useEffect(() => {
  //   const errorHandler = (event: unknown): void => {
  //     logger.error('StatsigProviderWrapper', {
  //       tags: { file: 'StatsigProviderWrapper', function: 'error' },
  //       extra: {
  //         event,
  //       },
  //     })
  //   }
  //   client.on('error', errorHandler)
  //   client.on('initialization_failure', errorHandler)
  //   return () => {
  //     client.off('error', errorHandler)
  //     client.off('initialization_failure', errorHandler)
  //   }
  // }, [client])

  // return <StatsigProvider client={client}>{children}</StatsigProvider>
  
  // HKSWAP: Create a mock StatsigClient that returns false for all feature flags
  // This ensures useFeatureFlag hooks work without actually initializing Statsig
  const mockClient = useMemo(() => {
    // Create a minimal mock client that satisfies the StatsigProvider requirements
    // All feature flags will return false by default
    return StatsigClient.instance('dummy-key-for-hkswap')
  }, [])

  useEffect(() => {
    // Call onInit immediately since we're not actually initializing Statsig
    onInit?.()
  }, [onInit])

  // Return StatsigProvider with mock client to satisfy hooks that require StatsigContext
  return <StatsigProvider client={mockClient}>{children}</StatsigProvider>
}
