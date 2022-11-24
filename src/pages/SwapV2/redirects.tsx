import { Redirect, RouteComponentProps } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapNetwork({ location }: RouteComponentProps) {
  const { networkInfo } = useActiveWeb3React()
  return <Redirect to={{ ...location, pathname: `${APP_PATHS.SWAP}/` + networkInfo.route }} />
}
