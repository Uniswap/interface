import { useLocation } from 'react-router-dom'

export function useIsBuyPage() {
  const { pathname } = useLocation()
  return pathname === '/buy'
}
