import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import AddLiquidity from 'pages/AddLiquidity/index'
import { Navigate, useParams } from 'react-router-dom'

export default function AddLiquidityWithTokenRedirects() {
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string; feeAmount?: string }>()

  const { chainId } = useAccount()

  // prevent weth + eth
  const isETHOrWETHA =
    currencyIdA === 'ETH' || (chainId !== undefined && currencyIdA === WRAPPED_NATIVE_CURRENCY[chainId]?.address)
  const isETHOrWETHB =
    currencyIdB === 'ETH' || (chainId !== undefined && currencyIdB === WRAPPED_NATIVE_CURRENCY[chainId]?.address)

  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Navigate to={`/add/${currencyIdA}`} replace />
  }
  return <AddLiquidity />
}
