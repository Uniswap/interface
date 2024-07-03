import { useLocation } from 'react-router-dom'
export function useIsSwapPage() {
  const { pathname } = useLocation()
  return pathname.endsWith('/swap')
}
