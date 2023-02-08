import { WETH } from '@kyberswap/ks-sdk-core'
import { Navigate, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

import ProAmmAddLiquidity from './index'

export function RedirectDuplicateTokenIds() {
  const { currencyIdA, currencyIdB } = useParams()

  const { chainId } = useActiveWeb3React()

  // prevent weth + eth
  const isETHOrWETHA = currencyIdA === 'ETH' || currencyIdA === WETH[chainId].address
  const isETHOrWETHB = currencyIdB === 'ETH' || currencyIdB === WETH[chainId].address

  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Navigate to={`${APP_PATHS.ELASTIC_CREATE_POOL}/${currencyIdA}`} replace />
  }
  return <ProAmmAddLiquidity />
}
