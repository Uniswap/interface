import groupBy from 'lodash/groupBy'
import { useCallback, useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { SearchTokensQuery, useSearchTokensQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult } from 'src/features/dataApi/types'
import {
  gqlTokenToCurrencyInfo,
  sortTokensWithinProject,
  usePersistedError,
} from 'src/features/dataApi/utils'

const NO_PROJECT = 'NO_PROJECT'

export function useSearchTokens(
  searchQuery: string | null,
  chainFilter: ChainId | null,
  skip: boolean
): GqlResult<CurrencyInfo[]> {
  const { data, loading, error, refetch } = useSearchTokensQuery({
    variables: { searchQuery: searchQuery ?? '' },
    skip,
  })

  const persistedError = usePersistedError(loading, error)

  const formattedData = useMemo(() => {
    if (!data || !data.searchTokens) return

    const reorderedProjectTokens = reorderChainsForProject(data.searchTokens)

    if (!reorderedProjectTokens) return

    return reorderedProjectTokens
      .map((token) => {
        if (!token) return null

        return gqlTokenToCurrencyInfo(token, chainFilter)
      })
      .filter((c): c is CurrencyInfo => Boolean(c))
  }, [data, chainFilter])

  const retry = useCallback(
    () => !skip && refetch({ searchQuery: searchQuery ?? '' }),
    [refetch, searchQuery, skip]
  )

  return useMemo(
    () => ({ data: formattedData, loading, error: persistedError, refetch: retry }),
    [formattedData, loading, retry, persistedError]
  )
}

export function reorderChainsForProject(
  tokens: SearchTokensQuery['searchTokens']
): SearchTokensQuery['searchTokens'] {
  if (!tokens) return tokens

  const groupOrder = tokens.reduce<Array<string>>((acc, token) => {
    const projectId = token?.project?.id ?? NO_PROJECT
    if (acc.indexOf(projectId) === -1) {
      acc.push(projectId)
    }
    return acc
  }, [])

  const groups = groupBy(tokens, (token) => token?.project?.id ?? NO_PROJECT)

  const result = groupOrder
    .map((projectId) => {
      const projectTokens = groups[projectId]
      if (projectTokens) {
        return projectId === NO_PROJECT ? projectTokens : sortTokensWithinProject(projectTokens)
      }
      return null
    })
    .filter(Boolean)
    .flat()

  return result
}
