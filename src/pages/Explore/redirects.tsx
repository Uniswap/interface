import { Navigate, useParams } from 'react-router-dom'

export default function RedirectExploreTokens() {
  const { chainName, tokenAddress } = useParams<{ chainName: string; tokenAddress: string }>()
  if (chainName && tokenAddress) {
    return <Navigate to={`/explore/tokens/${chainName}/${tokenAddress}`} replace />
  } else if (chainName) {
    return <Navigate to={`/explore/tokens/${chainName}`} replace />
  }

  return <Navigate to="/explore/tokens" replace />
}
