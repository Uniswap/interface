import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { MismatchAccountEffects } from 'uniswap/src/features/smartWallet/mismatch/MismatchAccountEffects'
import type {
  HasMismatchInput,
  HasMismatchResult,
  HasMismatchUtil,
} from 'uniswap/src/features/smartWallet/mismatch/mismatch'
import { useEvent } from 'utilities/src/react/hooks'

interface MismatchContextValue {
  mismatchCallback: HasMismatchUtil
  account: { address?: string; chainId?: number }
  onHasAnyMismatch: () => void
  chains: UniverseChainId[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
}

type MismatchContextProviderProps = Omit<MismatchContextValue, 'account'> & MismatchContextValue['account']

const MismatchContext = createContext<MismatchContextValue | undefined>(undefined)

export const MismatchContextProvider = React.memo(function MismatchContextProvider({
  children,
  mismatchCallback: mismatchCallbackProp,
  address,
  chainId,
  onHasAnyMismatch,
  chains,
  defaultChainId,
  isTestnetModeEnabled,
}: PropsWithChildren<MismatchContextProviderProps>): JSX.Element {
  const isMismatchForced = useIsMismatchForced()
  const mismatchCallback = useEvent(async (input: HasMismatchInput): HasMismatchResult => {
    if (isMismatchForced) {
      return {
        [String(chainId)]: true,
      }
    }
    return mismatchCallbackProp(input)
  })
  const value = useMemo(
    () => ({
      mismatchCallback,
      account: { address, chainId },
      onHasAnyMismatch,
      chains,
      defaultChainId,
      isTestnetModeEnabled,
    }),
    [mismatchCallback, address, chainId, onHasAnyMismatch, chains, defaultChainId, isTestnetModeEnabled],
  )
  return (
    <MismatchContext.Provider value={value}>
      {/* handle our effects here */}
      <MismatchAccountEffects />
      {children}
    </MismatchContext.Provider>
  )
})

MismatchContextProvider.displayName = 'MismatchContextProvider'

export function useMismatchContext(): MismatchContextValue {
  const value = useContext(MismatchContext)
  if (!value) {
    throw new Error('MismatchContext not found')
  }
  return value
}

function useIsMismatchForced(): boolean {
  return useFeatureFlag(FeatureFlags.ForcePermitTransactions)
}
