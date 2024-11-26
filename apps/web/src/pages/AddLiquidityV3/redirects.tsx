import { checkIsNative } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import AddLiquidity from 'pages/AddLiquidityV3/index'
import { Navigate, useParams } from 'react-router-dom'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export default function AddLiquidityV3WithTokenRedirects() {
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string; feeAmount?: string }>()

  const { chainId } = useAccount()

  if (isLPRedesignEnabled) {
    // TODO(WEB-5361): update this to enable prefilling form from URL currencyIdA and currencyIdB
    return <Navigate to="/positions/create" replace />
  }

  // prevent weth + eth
  const isETHOrWETHA =
    checkIsNative(currencyIdA) || (chainId !== undefined && currencyIdA === WRAPPED_NATIVE_CURRENCY[chainId]?.address)
  const isETHOrWETHB =
    checkIsNative(currencyIdB) || (chainId !== undefined && currencyIdB === WRAPPED_NATIVE_CURRENCY[chainId]?.address)

  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Navigate to={`/add/${currencyIdA}`} replace />
  }
  return <AddLiquidity />
}
