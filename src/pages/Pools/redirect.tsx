import { Redirect, RouteComponentProps } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

export function RedirectPathToPoolsNetwork({ location }: RouteComponentProps) {
  const { networkInfo } = useActiveWeb3React()
  return <Redirect to={{ ...location, pathname: `${APP_PATHS.POOLS}/` + networkInfo.route }} />
}
