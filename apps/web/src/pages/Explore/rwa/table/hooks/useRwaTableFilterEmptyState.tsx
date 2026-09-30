import { Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { useEvent } from 'utilities/src/react/hooks'
import type { TableEmptyState } from '~/components/Table/types'
import { getTokenExploreURL } from '~/data/util'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { ExploreTab } from '~/types/explore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/**
 * Categories carry their own token universe, so the chain and search filters can hide every row —
 * that reads as "this category is empty" unless the table offers a way back to the unfiltered list.
 */
export function useRwaTableFilterEmptyState(isEmpty: boolean): TableEmptyState | undefined {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const chainId = useChainIdFromUrlParam()
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const { setFilterString } = useExploreTablesFilterStoreActions()

  const hasActiveFilters = chainId !== undefined || filterString.trim().length > 0

  const clearFilters = useEvent(() => {
    setFilterString('')
    if (chainId) {
      // Keeps `?category=` so clearing drops the chain without leaving the category.
      navigate(`${getTokenExploreURL({ tab: ExploreTab.Tokens })}${search}`)
    }
  })

  return useMemo(() => {
    if (!isEmpty || !hasActiveFilters) {
      return undefined
    }
    return {
      title: t('common.filters.noResults'),
      action: (
        <TouchableArea onPress={clearFilters} testID={TestID.ExploreClearFilters}>
          <Text variant="buttonLabel3" color="$accent1">
            {t('common.filters.clear')}
          </Text>
        </TouchableArea>
      ),
    }
  }, [isEmpty, hasActiveFilters, clearFilters, t])
}
