import { GqlResult, GraphQLApi } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { isBackendSupportedChainId } from 'uniswap/src/features/chains/utils'
import { tokenProjectToCurrencyInfos } from 'uniswap/src/features/dataApi/tokenProjects/utils/tokenProjectToCurrencyInfos'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { CurrencyId } from 'uniswap/src/types/currency'

/**
 * Fetches token information as CurrencyInfo from currencyIds. When used, wrap component
 * with Suspense.
 */
export function useTokenProjects(currencyIds: CurrencyId[]): GqlResult<CurrencyInfo[]> {
  const contracts = useMemo(() => currencyIds.map((id) => currencyIdToContractInput(id)), [currencyIds])

  // Skip GraphQL query for chains that don't support backend (like HashKey)
  const shouldSkip = useMemo(() => {
    if (currencyIds.length === 0) {
      return true
    }
    // Check if all currencyIds are from unsupported chains
    return currencyIds.every((id) => {
      const chainId = currencyIdToChain(id)
      return chainId && !isBackendSupportedChainId(chainId)
    })
  }, [currencyIds])

  const { data, loading, error, refetch } = GraphQLApi.useTokenProjectsQuery({
    variables: { contracts },
    skip: shouldSkip,
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
