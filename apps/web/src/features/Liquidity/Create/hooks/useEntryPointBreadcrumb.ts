import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

export function useEntryPointBreadcrumb(): { label: string; to: string } {
  const { t } = useTranslation()
  const location = useLocation()
  const state = location.state as { entryPoint?: string; from?: string } | null
  const entryPoint = state?.entryPoint ?? state?.from

  return useMemo(() => {
    if (entryPoint?.startsWith('/explore/pools/')) {
      return { label: t('common.pool'), to: entryPoint }
    }
    if (entryPoint === '/explore/pools') {
      return { label: t('common.pools'), to: '/explore/pools' }
    }
    return { label: t('pool.positions.title'), to: '/positions' }
  }, [entryPoint, t])
}
