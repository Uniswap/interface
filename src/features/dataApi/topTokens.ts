import { useMemo } from 'react'
import { useTopTokensQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult } from 'src/features/dataApi/types'
import { tokenProjectToCurrencyInfos } from 'src/features/dataApi/utils'

export function usePopularTokens(): GqlResult<CurrencyInfo[]> {
  const { data, loading } = useTopTokensQuery()

  const formattedData = useMemo(() => {
    if (!data || !data.topTokenProjects) return

    return tokenProjectToCurrencyInfos(data.topTokenProjects)
  }, [data])

  return useMemo(() => ({ data: formattedData, loading }), [formattedData, loading])
}
