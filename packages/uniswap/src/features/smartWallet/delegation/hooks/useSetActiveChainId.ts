import { useDispatch } from 'react-redux'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { setActiveChainId } from 'uniswap/src/features/smartWallet/delegation/slice'
import { useEvent } from 'utilities/src/react/hooks'

export function useSetActiveChainId(): (chainId?: UniverseChainId) => void {
  const dispatch = useDispatch()
  return useEvent((chainId?: UniverseChainId) => {
    dispatch(setActiveChainId({ chainId }))
  })
}
