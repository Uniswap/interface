import type { Currency } from '@uniswap/sdk-core'
import { useNavigate } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { getChainUrlParam } from '~/utils/params/chainParams'

/**
 * `Currency` is `NativeCurrency | Token`; `keyof Currency` omits `address` (native has no address), so
 * `Pick<Currency, 'address'>` is invalid. Callers may pass a full `Currency` or a minimal `{ chainId, address }`.
 */
export type TokenDetailsNavigationInput = Currency | { chainId: number; address: string; isNative?: false }

export function useNavigateToTokenDetails(): (
  currency: Maybe<TokenDetailsNavigationInput>,
  chainFilter?: UniverseChainId,
) => void {
  const navigate = useNavigate()

  return useEvent((currency: Maybe<TokenDetailsNavigationInput>, chainFilter?: UniverseChainId) => {
    if (!currency) {
      return
    }

    const url = getTokenDetailsURL({
      address: currency.isNative ? null : currency.address,
      chain: toGraphQLChain(currency.chainId),
      chainQueryParam: chainFilter ? getChainUrlParam(chainFilter) : undefined,
    })
    navigate(url)
  })
}
