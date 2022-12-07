import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapNetwork() {
  const location = useLocation
  const { networkInfo } = useActiveWeb3React()
  return <Navigate to={{ ...location, pathname: `${APP_PATHS.SWAP}/` + networkInfo.route }} />
}
