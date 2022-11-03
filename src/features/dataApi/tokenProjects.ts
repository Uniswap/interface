import { useMemo } from 'react'
import { useTokenProjectsQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, GqlResult } from 'src/features/dataApi/types'
import { currencyIdToContractInput, tokenProjectToCurrencyInfos } from 'src/features/dataApi/utils'
import { CurrencyId } from 'src/utils/currencyId'

/**
 * Fetches token information as CurrencyInfo from currencyIds. When used, wrap component
 * with Suspense.
 */
export function useTokenProjects(currencyIds: CurrencyId[]): GqlResult<CurrencyInfo[]> {
  const contracts = useMemo(
    () => currencyIds.map((id) => currencyIdToContractInput(id)),
    [currencyIds]
  )

  const { data, loading } = useTokenProjectsQuery({
    variables: { contracts },
  })

  const formattedData = useMemo(() => {
    if (!data || !data.tokenProjects) return

    return tokenProjectToCurrencyInfos(data.tokenProjects)
  }, [data])

  return { data: formattedData, loading }
}
