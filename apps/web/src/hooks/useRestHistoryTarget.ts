import { useMemo } from 'react'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { toHistoryTarget, type HistoryTarget } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { nativeAddressForRest } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'

/** Builds the REST target for TokenPriceChartQueryVariables, or undefined when REST can't be resolved yet. */
export function useRestHistoryTarget(variables: TokenPriceChartQueryVariables): HistoryTarget | undefined {
  return useMemo(() => {
    const chainId = fromGraphQLChain(variables.chain)
    if (!chainId) {
      return undefined
    }
    const address = variables.address ?? nativeAddressForRest(chainId)
    return toHistoryTarget({ chainId, address, multichain: variables.multichain })
  }, [variables.chain, variables.address, variables.multichain])
}
