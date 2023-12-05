import { useCallback, useMemo } from 'react'
import { useTokenProjectsQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult } from 'wallet/src/features/dataApi/types'
import {
  currencyIdToContractInput,
  tokenProjectToCurrencyInfos,
} from 'wallet/src/features/dataApi/utils'
import { CurrencyId } from 'wallet/src/utils/currencyId'

/**
 * Fetches token information as CurrencyInfo from currencyIds. When used, wrap component
 * with Suspense.
 */
export function useTokenProjects(currencyIds: CurrencyId[]): GqlResult<CurrencyInfo[]> {
  const contracts = useMemo(
    () => currencyIds.map((id) => currencyIdToContractInput(id)),
    [currencyIds]
  )

  const { data, loading, refetch } = useTokenProjectsQuery({
    variables: { contracts },
  })

  const formattedData = useMemo(() => {
    if (!data || !data.tokenProjects) return

    return tokenProjectToCurrencyInfos(data.tokenProjects)
  }, [data])

  const retry = useCallback(() => refetch({ contracts }), [contracts, refetch])

  return { data: formattedData, loading, refetch: retry }
}
