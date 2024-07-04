import { useLocation } from 'react-router-dom'
export function useIsSendPage() {
  const { pathname } = useLocation()
  return pathname.endsWith('/send')
}
