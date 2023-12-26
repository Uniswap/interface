import { useLocation } from 'react-router-dom'

export function useIsPoolsPage() {
  const { pathname } = useLocation()
  return (
    pathname.startsWith('/pools') ||
    pathname.startsWith('/pool') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/remove')
  )
}
