import type { Currency } from '@uniswap/sdk-core'
import { useNavigate } from 'react-router'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import type { TdpChainSelection } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { getTdpChainQueryParam } from '~/utils/params/chainQueryParam'

/**
 * `Currency` is `NativeCurrency | Token`; `keyof Currency` omits `address` (native has no address), so
 * `Pick<Currency, 'address'>` is invalid. Callers may pass a full `Currency` or a minimal `{ chainId, address }`.
 */
export type TokenDetailsNavigationInput = Currency | { chainId: number; address: string; isNative?: false }

export function useNavigateToTokenDetails(): (
  currency: Maybe<TokenDetailsNavigationInput>,
  chainSelection?: TdpChainSelection,
) => void {
  const navigate = useNavigate()

  return useEvent((currency: Maybe<TokenDetailsNavigationInput>, chainSelection?: TdpChainSelection) => {
    if (!currency) {
      return
    }

    const url = getTokenDetailsURL({
      address: currency.isNative ? null : currency.address,
      chain: toGraphQLChain(currency.chainId),
      chainQueryParam: getTdpChainQueryParam({ selection: chainSelection, tokenChainId: currency.chainId }),
    })
    navigate(url)
  })
}
