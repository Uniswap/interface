import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

export function RedirectPathToMyPoolsNetwork() {
  const location = useLocation()
  const { networkInfo } = useActiveWeb3React()
  return <Navigate to={{ ...location, pathname: `${APP_PATHS.MY_POOLS}/` + networkInfo.route }} replace />
}
