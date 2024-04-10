import { useCallback, useMemo } from 'react'
import { useTokenProjectsQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
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

  const { data, loading, error, refetch } = useTokenProjectsQuery({
    variables: { contracts },
  })

  const formattedData = useMemo(() => {
    if (!data || !data.tokenProjects) {
      return
    }

    return tokenProjectToCurrencyInfos(data.tokenProjects)
  }, [data])

  const retry = useCallback(() => refetch({ contracts }), [contracts, refetch])

  return { data: formattedData, loading, refetch: retry, error }
}
