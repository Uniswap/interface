import { useLocation } from 'react-router-dom'
export function useIsLimitPage() {
  const { pathname } = useLocation()
  return pathname.endsWith('/limit')
}
