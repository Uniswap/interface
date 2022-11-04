import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useSearchTokensProjectsQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult } from 'src/features/dataApi/types'
import { tokenProjectToCurrencyInfos } from 'src/features/dataApi/utils'

export function useSearchTokens(
  searchQuery: string | null,
  chainFilter: ChainId | null,
  skip: boolean
): GqlResult<CurrencyInfo[]> {
  const { data, loading } = useSearchTokensProjectsQuery({
    variables: { searchQuery: searchQuery ?? '' },
    skip,
  })

  const formattedData = useMemo(() => {
    if (!data || !data.searchTokenProjects) return

    return tokenProjectToCurrencyInfos(data.searchTokenProjects, chainFilter)
  }, [data, chainFilter])

  return useMemo(() => ({ data: formattedData, loading }), [formattedData, loading])
}
