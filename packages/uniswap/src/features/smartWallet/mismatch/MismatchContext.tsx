import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { PropsWithChildren, useMemo } from 'react'
import type { HasMismatchInput, HasMismatchResult } from 'uniswap/src/features/smartWallet/mismatch/mismatch'
import { MismatchAccountEffects } from 'uniswap/src/features/smartWallet/mismatch/MismatchAccountEffects'
import {
  MismatchContext,
  type MismatchContextValue,
} from 'uniswap/src/features/smartWallet/mismatch/MismatchContextValue'
import { useEvent } from 'utilities/src/react/hooks'

export { useMismatchContext } from 'uniswap/src/features/smartWallet/mismatch/MismatchContextValue'
export type { MismatchContextValue } from 'uniswap/src/features/smartWallet/mismatch/MismatchContextValue'

type MismatchContextProviderProps = Omit<MismatchContextValue, 'account'> & MismatchContextValue['account']

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

function useIsMismatchForced(): boolean {
  return useFeatureFlag(FeatureFlags.ForcePermitTransactions)
}
