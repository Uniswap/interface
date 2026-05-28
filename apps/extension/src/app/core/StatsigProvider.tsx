import { useQuery } from '@tanstack/react-query'
import { SharedQueryClient } from '@universe/api'
import { type StatsigUser } from '@universe/gating'
import { useMemo } from 'react'
import { makeStatsigUser } from 'src/app/core/initStatSigForBrowserScripts'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { initializeDatadog } from 'uniswap/src/utils/datadog'
import { uniqueIdQuery } from 'utilities/src/device/uniqueIdQuery'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Warms the uniqueId cache so `ExtensionStatsigProvider` can render with a valid
 * `userID` on first mount. Call once per entry point before `createRoot().render(...)`.
 */
export function prefetchExtensionStatsigUserId(): void {
  SharedQueryClient.prefetchQuery(uniqueIdQuery()).catch(() => undefined)
}

export function ExtensionStatsigProvider({
  children,
  appName,
}: {
  children: React.ReactNode
  appName: string
}): JSX.Element | null {
  const { data: uniqueId } = useQuery(uniqueIdQuery(), SharedQueryClient)

  const user = useMemo<StatsigUser | null>(() => (uniqueId ? makeStatsigUser(uniqueId) : null), [uniqueId])

  const onStatsigInit = useEvent((): void => {
    initializeDatadog(appName).catch(() => undefined)
  })

  // We don't want to initialize Statsig until the user ID is ready, as it messes up experiment exposure data.
  if (!user) {
    // This should never happen, as the user should always exist by the time this component is rendered,
    // unless for some reason the cache is too slow.
    return null
  }

  return (
    <StatsigProviderWrapper user={user} onInit={onStatsigInit}>
      {children}
    </StatsigProviderWrapper>
  )
}
