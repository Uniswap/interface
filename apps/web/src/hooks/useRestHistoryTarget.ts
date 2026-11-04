import { useMemo } from 'react'
import { toHistoryTarget, type HistoryTarget } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { nativeAddressForRest } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'

/** Builds the REST target for TokenPriceChartQueryVariables, or undefined when REST can't be resolved yet. */
export function useRestHistoryTarget(variables: TokenPriceChartQueryVariables): HistoryTarget | undefined {
  return useMemo(() => {
    const address = variables.address ?? nativeAddressForRest(variables.chainId)
    return toHistoryTarget({ chainId: variables.chainId, address, multichain: variables.multichain })
  }, [variables.chainId, variables.address, variables.multichain])
}
