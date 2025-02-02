import { checkIsNative } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import AddLiquidity from 'pages/AddLiquidityV3/index'
import { Navigate, useParams } from 'react-router-dom'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export default function AddLiquidityV3WithTokenRedirects() {
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)
  const { currencyIdA, currencyIdB, tokenId } = useParams<{
    currencyIdA: string
    currencyIdB: string
    feeAmount?: string
    tokenId?: string
  }>()
  const { chainId: connectedChainId } = useAccount()
  const { defaultChainId } = useEnabledChains()

  if (isLPRedesignEnabled) {
    if (tokenId) {
      const chainName = getChainInfo(connectedChainId ?? defaultChainId)?.urlParam
      return <Navigate to={`/positions/v3/${chainName}/${tokenId}`} replace />
    }

    const url = new URL('/positions/create/v3', window.location.origin)
    if (currencyIdA) {
      url.searchParams.append('currencyA', currencyIdA)
    }
    if (currencyIdB && currencyIdA?.toLowerCase() !== currencyIdB?.toLowerCase()) {
      url.searchParams.append('currencyB', currencyIdB)
    }
    return <Navigate to={url.pathname + url.search} replace />
  }

  // prevent weth + eth
  const isETHOrWETHA =
    checkIsNative(currencyIdA) ||
    (connectedChainId !== undefined && currencyIdA === WRAPPED_NATIVE_CURRENCY[connectedChainId]?.address)
  const isETHOrWETHB =
    checkIsNative(currencyIdB) ||
    (connectedChainId !== undefined && currencyIdB === WRAPPED_NATIVE_CURRENCY[connectedChainId]?.address)
  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Navigate to={`/add/${currencyIdA}`} replace />
  }
  return <AddLiquidity />
}
