import { useLocation } from 'react-router-dom'

const useIsNftPage = () => {
  const { pathname } = useLocation()
  return pathname.startsWith('/nfts')
}

export default useIsNftPage
