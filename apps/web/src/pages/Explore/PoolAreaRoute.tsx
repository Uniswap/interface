import { isSVMChain } from '@universe/chains'
import type { ReactNode } from 'react'
import { Navigate, useLocation, useParams, useSearchParams } from 'react-router'
import { getPoolAreaUrls } from '~/features/Explore/poolArea/utils/poolAreaUrls'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

export function PoolAreaRoute({ tab, children }: { tab: 'pools' | 'hooks'; children: ReactNode }): JSX.Element {
  const { chainName } = useParams<{ chainName?: string }>()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const chainId = getChainIdFromChainUrlParam(chainName)

  if (chainName && (chainId === undefined || isSVMChain(chainId))) {
    return <Navigate to={getPoolAreaUrls({ pathname, searchParams })[tab]} replace />
  }

  return <>{children}</>
}
