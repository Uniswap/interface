import { useEffect } from 'react'
import { InteractionManager } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { baseCurrencyIds } from 'src/components/TokenSelector/hooks'
import {
  useExploreTokensTabLazyQuery,
  useTokenProjectsLazyQuery,
  useTopTokensLazyQuery,
} from 'src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { getTokensOrderByValues } from 'src/features/explore/utils'
import { selectTokensOrderBy } from 'src/features/wallet/selectors'

/** Set of queries that should be preloaded, but can wait for idle time. */
export function useLowPriorityPreloadedQueries(): void {
  // Explore screen
  const [loadExploreTokens] = useExploreTokensTabLazyQuery()
  const orderBy = useAppSelector(selectTokensOrderBy)

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      const { serverOrderBy } = getTokensOrderByValues(orderBy)
      loadExploreTokens({ variables: { topTokensOrderBy: serverOrderBy } })
    })
    // only want to preload on app mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadExploreTokens])

  // Token selector
  const [loadTopTokens] = useTopTokensLazyQuery()
  const [loadTokenProjects] = useTokenProjectsLazyQuery()

  useEffect(() => {
    const baseCurrencyContracts = baseCurrencyIds.map((id) => currencyIdToContractInput(id))

    InteractionManager.runAfterInteractions(() => {
      loadTokenProjects({ variables: { contracts: baseCurrencyContracts } })
      loadTopTokens()
    })
  }, [loadTopTokens, loadTokenProjects])
}
