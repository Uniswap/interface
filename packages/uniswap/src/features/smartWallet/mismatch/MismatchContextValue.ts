import { createContext, useContext } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { HasMismatchUtil } from 'uniswap/src/features/smartWallet/mismatch/mismatch'

export interface MismatchContextValue {
  mismatchCallback: HasMismatchUtil
  account: { address?: string; chainId?: number }
  onHasAnyMismatch: () => void
  chains: UniverseChainId[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
}

export const MismatchContext = createContext<MismatchContextValue | undefined>(undefined)

export function useMismatchContext(): MismatchContextValue {
  const value = useContext(MismatchContext)
  if (!value) {
    throw new Error('MismatchContext not found')
  }
  return value
}
