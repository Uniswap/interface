import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { isSupportLimitOrder } from 'utils'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapNetwork() {
  const { networkInfo, chainId } = useActiveWeb3React()
  const { pathname, ...rest } = useLocation()
  return (
    <Navigate
      to={{
        ...rest,
        pathname: `${
          pathname.startsWith(APP_PATHS.LIMIT) && isSupportLimitOrder(chainId) ? APP_PATHS.LIMIT : APP_PATHS.SWAP
        }/${networkInfo.route}`,
      }}
    />
  )
}
