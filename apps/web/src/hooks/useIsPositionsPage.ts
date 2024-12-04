import { useLocation } from 'react-router-dom'
export function useIsPositionsPage() {
  const { pathname } = useLocation()
  return pathname.includes('/positions')
}
