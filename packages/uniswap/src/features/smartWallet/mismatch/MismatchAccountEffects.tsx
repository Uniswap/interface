import React from 'react'
import {
  useCurrentAccountChainMismatchEffect,
  useOnConnectCheckAllAccountChainMismatchEffect,
} from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { useMismatchContext } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'
import { useOnDisconnectEffect } from 'uniswap/src/features/smartWallet/mismatch/useOnDisconnectEffect'
import { isTestEnv } from 'utilities/src/environment/env'

/**
 * MismatchAccountEffects -- handles the effects of the mismatch account
 * @returns null
 */
const MismatchAccountEffectsInner: React.FC = React.memo(() => {
  // check all account chain mismatch queries on wallet connect
  useOnConnectCheckAllAccountChainMismatchEffect()
  // handles when chain changes and invalidates the current account chain mismatch query
  useCurrentAccountChainMismatchEffect()

  return null
})

MismatchAccountEffectsInner.displayName = 'MismatchAccountEffects'

// we don't want to run the smart account wallet effects in tests
export const MismatchAccountEffects: React.FC = () => {
  const account = useMismatchContext().account

  // clean up the toast state when the account disconnects
  // we keep this in this component because it needs to be run on every account change
  // the child component unmounts as soon the account is null (web only)
  useOnDisconnectEffect()

  if (!account.address || isTestEnv()) {
    return null
  }
  return <MismatchAccountEffectsInner />
}
