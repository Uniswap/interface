import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'

import { RouterPreference } from './routing/types'
import { TransactionState } from './transactions/reducer'
import { UserState } from './user/reducer'
import { SlippageTolerance } from './user/types'

const currentTimestamp = () => new Date().getTime()

/**
 * These functions handle all migrations that existed before we started tracking version numbers.
 */

export function legacyTransactionMigrations(state: any): TransactionState {
  // Make a copy of the object so we can mutate it.
  const result = JSON.parse(JSON.stringify(state))
  // in case there are any transactions in the store with the old format, remove them
  Object.keys(result).forEach((chainId) => {
    const chainTransactions = result[chainId as unknown as number]
    Object.keys(chainTransactions).forEach((hash) => {
      if (!('info' in chainTransactions[hash])) {
        // clear old transactions that don't have the right format
        delete chainTransactions[hash]
      }
    })
  })
  return result
}

export function legacyUserMigrations(state: any): UserState {
  // Make a copy of the object so we can mutate it.
  const result = JSON.parse(JSON.stringify(state))
  // If `selectedWallet` is a WalletConnect v1 wallet, reset to default.
  if (state.selectedWallet) {
    const selectedWallet = state.selectedWallet as string
    if (selectedWallet === 'UNIWALLET' || selectedWallet === 'UNISWAP_WALLET' || selectedWallet === 'WALLET_CONNECT') {
      delete state.selectedWallet
    }
  }

  // If `userSlippageTolerance` is not present or its value is invalid, reset to default
  if (
    typeof result.userSlippageTolerance !== 'number' ||
    !Number.isInteger(result.userSlippageTolerance) ||
    result.userSlippageTolerance < 0 ||
    result.userSlippageTolerance > 5000
  ) {
    result.userSlippageTolerance = SlippageTolerance.Auto
  } else {
    if (
      !result.userSlippageToleranceHasBeenMigratedToAuto &&
      [10, 50, 100].indexOf(result.userSlippageTolerance) !== -1
    ) {
      result.userSlippageTolerance = SlippageTolerance.Auto
      result.userSlippageToleranceHasBeenMigratedToAuto = true
    }
  }

  // If `userDeadline` is not present or its value is invalid, reset to default
  if (
    typeof result.userDeadline !== 'number' ||
    !Number.isInteger(result.userDeadline) ||
    result.userDeadline < 60 ||
    result.userDeadline > 180 * 60
  ) {
    result.userDeadline = DEFAULT_DEADLINE_FROM_NOW
  }

  // If `userRouterPreference` is not present, reset to default
  if (typeof result.userRouterPreference !== 'string') {
    result.userRouterPreference = RouterPreference.API
  }

  // If `userRouterPreference` is `AUTO`, migrate to `API`
  if ((state.userRouterPreference as string) === 'auto') {
    state.userRouterPreference = RouterPreference.API
  }

  //If `buyFiatFlowCompleted` is present, delete it using filtering
  if ('buyFiatFlowCompleted' in result) {
    //ignoring due to type errors occuring since we now remove this state
    //@ts-ignore
    delete result.buyFiatFlowCompleted
  }

  result.lastUpdateVersionTimestamp = currentTimestamp()
  return result
}
