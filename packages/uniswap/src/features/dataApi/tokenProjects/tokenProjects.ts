import { GqlResult, GraphQLApi } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { tokenProjectToCurrencyInfos } from 'uniswap/src/features/dataApi/tokenProjects/utils/tokenProjectToCurrencyInfos'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { CurrencyId } from 'uniswap/src/types/currency'

/**
 * Fetches token information as CurrencyInfo from currencyIds. When used, wrap component
 * with Suspense.
 */
export function useTokenProjects(currencyIds: CurrencyId[]): GqlResult<CurrencyInfo[]> {
  const contracts = useMemo(() => currencyIds.map((id) => currencyIdToContractInput(id)), [currencyIds])

  const { data, loading, error, refetch } = GraphQLApi.useTokenProjectsQuery({
    variables: { contracts },
    skip: currencyIds.length === 0,
  })

  const formattedData = useMemo(() => {
    if (!data || !data.tokenProjects) {
      return undefined
    }

    return tokenProjectToCurrencyInfos(data.tokenProjects)
  }, [data])

  const retry = useCallback(() => refetch({ contracts }), [contracts, refetch])

  return useMemo(
    () => ({ data: formattedData, loading, refetch: retry, error }),
    [formattedData, loading, retry, error],
  )
}
