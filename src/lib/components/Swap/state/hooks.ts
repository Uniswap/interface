import { useAtom } from 'jotai'
import { useContext } from 'react'

import { StoreAtomContext } from '.'
import { toggleShowDetails } from './actions'

export function useSwapStore() {
  return useAtom(useContext(StoreAtomContext))
}

export function useShowDetails(): [boolean, () => void] {
  const [store, dispatch] = useSwapStore()
  return [store.showDetails, () => dispatch(toggleShowDetails())]
}
