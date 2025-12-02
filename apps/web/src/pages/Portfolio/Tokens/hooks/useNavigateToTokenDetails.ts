import { getTokenDetailsURL } from 'appGraphql/data/util'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { useNavigate } from 'react-router'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useEvent } from 'utilities/src/react/hooks'

export function useNavigateToTokenDetails(): (tokenData: TokenData) => void {
  const navigate = useNavigate()

  return useEvent((tokenData: TokenData) => {
    if (!tokenData.currencyInfo) {
      return
    }

    const { currency } = tokenData.currencyInfo
    const url = getTokenDetailsURL({
      address: currency.isNative ? null : currency.address,
      chain: toGraphQLChain(currency.chainId),
    })
    navigate(url)
  })
}
