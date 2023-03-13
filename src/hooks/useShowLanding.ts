import { parse } from 'qs'
import { useLocation } from 'react-router-dom'
import { useAppSelector } from 'state/hooks'

export function useShowLanding(): boolean {
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  const location = useLocation()
  const queryParams = parse(location.search, {
    ignoreQueryPrefix: true,
  })
  return queryParams.intro || !selectedWallet ? true : false
}
