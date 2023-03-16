import { useLocation } from 'react-router-dom'

export function useIsPoolPage() {
  const { pathname } = useLocation()
  return (
    pathname.startsWith('/pools') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/remove') ||
    pathname.startsWith('/increase')
  )
}
