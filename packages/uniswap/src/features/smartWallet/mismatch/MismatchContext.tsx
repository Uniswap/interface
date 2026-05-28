import React, { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { MismatchAccountEffects } from 'uniswap/src/features/smartWallet/mismatch/MismatchAccountEffects'
import { useEvent } from 'utilities/src/react/hooks'

interface MismatchContextValue {
  mismatchCallback: (input: { address: string; chainId: number }) => Promise<boolean>
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
  const mismatchCallback = useEvent(async (input: { address: string; chainId: number }) => {
    if (isMismatchForced) {
      return true
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
