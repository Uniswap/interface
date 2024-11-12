import { useLocation } from 'react-router-dom'
export function useIsMigrateV3Page() {
  const { pathname } = useLocation()
  return pathname.includes('/migrate/v3')
}
