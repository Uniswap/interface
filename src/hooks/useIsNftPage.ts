import { useLocation } from 'react-router-dom'

export function useIsNftPage() {
  const { pathname } = useLocation()
  return pathname.startsWith('/nfts')
}

export function useIsNftExplorePage() {
  const { pathname } = useLocation()
  return pathname === '/nfts'
}

export function useIsNftProfilePage() {
  const { pathname } = useLocation()
  return pathname.startsWith('/nfts/profile')
}

export function useIsNftDetailsPage() {
  const { pathname } = useLocation()
  return pathname.startsWith('/nfts/asset')
}
