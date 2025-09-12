import { createContext, Dispatch, SetStateAction } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type MultichainContextType = {
  reset: () => void
  setSelectedChainId: Dispatch<SetStateAction<UniverseChainId | undefined | null>>
  initialChainId?: UniverseChainId
  isUserSelectedToken: boolean
  setIsUserSelectedToken: Dispatch<SetStateAction<boolean>>
  // The chainId of the context - can be different from the connected Chain ID
  chainId?: UniverseChainId
  // Components may use MultichainContext while outside of the context
  // this flag is used to determine if we should fallback to account.chainId
  // instead of using the context chainId
  isMultichainContext: boolean
}

export const MultichainContext = createContext<MultichainContextType>({
  reset: () => undefined,
  setSelectedChainId: () => undefined,
  isUserSelectedToken: false,
  setIsUserSelectedToken: () => undefined,
  chainId: UniverseChainId.Mainnet,
  initialChainId: UniverseChainId.Mainnet,
  isMultichainContext: false,
})
