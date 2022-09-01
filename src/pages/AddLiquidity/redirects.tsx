import AddLiquidity from './index'
import { Redirect } from 'pages/Swap/redirects'
import { WETH9_EXTENDED } from '../../constants/tokens'
import { useActiveWeb3React } from 'hooks/web3'

export function RedirectDuplicateTokenIds(
  props: any
) {
  const {
    match: {
      params: { currencyIdA, currencyIdB },
    },
  } = props

  const { chainId } = useActiveWeb3React()

  // prevent weth + eth
  const isETHOrWETHA =
    currencyIdA === 'ETH' || (chainId !== undefined && currencyIdA === WETH9_EXTENDED[chainId]?.address)
  const isETHOrWETHB =
    currencyIdB === 'ETH' || (chainId !== undefined && currencyIdB === WETH9_EXTENDED[chainId]?.address)

  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Redirect to={`/add/${currencyIdA}`} />
  }
  return <AddLiquidity {...props} />
}
