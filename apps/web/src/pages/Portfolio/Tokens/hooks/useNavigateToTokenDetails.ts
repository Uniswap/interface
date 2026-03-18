import { Currency } from '@uniswap/sdk-core'
import { useNavigate } from 'react-router'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/appGraphql/data/util'

export function useNavigateToTokenDetails(): (currency: Maybe<Currency>) => void {
  const navigate = useNavigate()

  return useEvent((currency: Maybe<Currency>) => {
    if (!currency) {
      return
    }

    const url = getTokenDetailsURL({
      address: currency.isNative ? null : currency.address,
      chain: toGraphQLChain(currency.chainId),
    })
    navigate(url)
  })
}
