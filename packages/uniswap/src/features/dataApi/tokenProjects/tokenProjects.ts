import { GqlResult, GraphQLApi } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { tokenProjectToCurrencyInfos } from 'uniswap/src/features/dataApi/tokenProjects/utils/tokenProjectToCurrencyInfos'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'

type TokenProjects = NonNullable<GraphQLApi.TokenProjectsQuery['tokenProjects']>

/**
 * Fetches token information as CurrencyInfo from currencyIds. When used, wrap component
 * with Suspense.
 */
export function useTokenProjects(currencyIds: CurrencyId[]): GqlResult<CurrencyInfo[]> {
  return useFormattedTokenProjects(currencyIds, formatTokenProjects)
}

export function useTokenProjectsByCurrencyId(
  currencyIds: CurrencyId[],
): GqlResult<ReadonlyMap<CurrencyId, CurrencyInfo[]>> {
  return useFormattedTokenProjects(currencyIds, formatTokenProjectsByCurrencyId)
}

function useFormattedTokenProjects<T>(
  currencyIds: CurrencyId[],
  formatData: (tokenProjects: TokenProjects, currencyIds: CurrencyId[]) => T,
): GqlResult<T> {
  const contracts = useMemo(() => currencyIds.map((id) => currencyIdToContractInput(id)), [currencyIds])

  const { data, loading, error, refetch } = GraphQLApi.useTokenProjectsQuery({
    variables: { contracts },
    skip: currencyIds.length === 0,
  })

  const formattedData = useMemo(() => {
    if (!data || !data.tokenProjects) {
      return undefined
    }

    return formatData(data.tokenProjects, currencyIds)
  }, [currencyIds, data, formatData])

  const retry = useCallback(() => refetch({ contracts }), [contracts, refetch])

  return useMemo(
    () => ({ data: formattedData, loading, refetch: retry, error }),
    [formattedData, loading, retry, error],
  )
}

function formatTokenProjects(tokenProjects: TokenProjects): CurrencyInfo[] {
  return tokenProjectToCurrencyInfos(tokenProjects)
}

function formatTokenProjectsByCurrencyId(
  tokenProjects: TokenProjects,
  currencyIds: CurrencyId[],
): ReadonlyMap<CurrencyId, CurrencyInfo[]> {
  const byCurrencyId = new Map<CurrencyId, CurrencyInfo[]>()

  for (const tokenProject of tokenProjects) {
    if (!tokenProject) {
      continue
    }

    const currencyInfos = tokenProjectToCurrencyInfos([tokenProject])
    for (const currencyId of currencyIds) {
      if (byCurrencyId.has(currencyId) || !hasCurrencyInfoForCurrencyId(currencyInfos, currencyId)) {
        continue
      }

      byCurrencyId.set(currencyId, currencyInfos)
    }
  }

  return byCurrencyId
}

function hasCurrencyInfoForCurrencyId(currencyInfos: CurrencyInfo[], currencyId: CurrencyId): boolean {
  for (const currencyInfo of currencyInfos) {
    if (areCurrencyIdsEqual(currencyInfo.currencyId, currencyId)) {
      return true
    }
  }

  return false
}
