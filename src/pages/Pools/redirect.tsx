import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

export function RedirectPathToPoolsNetwork() {
  const location = useLocation()
  const { networkInfo } = useActiveWeb3React()
  return <Navigate to={{ ...location, pathname: `${APP_PATHS.POOLS}/` + networkInfo.route }} replace />
}
