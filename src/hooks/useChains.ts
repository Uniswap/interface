import { useSelector } from 'react-redux'
import { chainIdSelector } from '../state/application/selectors'

export const useChains = () => useSelector(chainIdSelector)
