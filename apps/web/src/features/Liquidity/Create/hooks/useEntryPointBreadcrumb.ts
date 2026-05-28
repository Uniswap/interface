import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { EntryPointKind, resolveEntryPoint } from '~/utils/createPositionEntryPoint'

export function useEntryPointBreadcrumb(): { label: string; to: string; hasEntryPoint: boolean } {
  const { t } = useTranslation()
  const location = useLocation()
  const entryPoint = resolveEntryPoint({ search: location.search, state: location.state })

  return useMemo(() => {
    if (entryPoint.kind === EntryPointKind.ExplorePoolDetail) {
      return { label: t('common.pool'), to: entryPoint.to, hasEntryPoint: true }
    } else if (entryPoint.kind === EntryPointKind.ExplorePools) {
      return { label: t('common.pools'), to: '/explore/pools', hasEntryPoint: true }
    } else if (entryPoint.kind === EntryPointKind.PortfolioPools) {
      return { label: t('common.portfolio'), to: entryPoint.to, hasEntryPoint: true }
    }
    return { label: t('pool.positions.title'), to: '/positions', hasEntryPoint: false }
  }, [entryPoint.kind, entryPoint.to, t])
}
