import { useContext } from 'react'
import { Context as HomeContext } from '../contexts/home'

const useHome = () => {
  const { home } = useContext(HomeContext)
  return [home]
}

export default useHome
