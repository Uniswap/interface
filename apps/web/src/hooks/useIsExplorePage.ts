import { useLocation } from 'react-router-dom'
export function useIsExplorePage() {
  const { pathname } = useLocation()
  return pathname.includes('/explore')
}
