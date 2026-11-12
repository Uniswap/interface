import { useOptimisticSearchParams } from 'nuqs/adapters/react-router/v7'
import { useLocation } from 'react-router'
import type { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { getPoolAreaNavigation } from '~/features/Explore/poolArea/utils/poolAreaUrls'

export function usePoolAreaNavigation({
  omitSearchParams,
}: {
  omitSearchParams?: readonly string[]
} = {}): Record<PoolAreaTab, string> {
  const { pathname } = useLocation()
  const searchParams = useOptimisticSearchParams()
  return getPoolAreaNavigation({ pathname, searchParams, omitSearchParams })
}
