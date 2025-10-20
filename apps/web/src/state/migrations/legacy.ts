import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { persistor } from 'state'
import { initialState as initialListsState } from 'state/lists/reducer'
import { RouterPreference } from 'state/routing/types'
import { initialState as initialUserState, UserState } from 'state/user/reducer'
import { SlippageTolerance } from 'state/user/types'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export interface LocalWebTransactionState {
  [address: Address]: {
    [chainId: number]: {
      [txId: string]: TransactionDetails
    }
  }
}

const initialTransactionsState: LocalWebTransactionState = {}

const currentTimestamp = () => new Date().getTime()

function tryParseOldState<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (_e) {
    return fallback
  }
}

/**
 * These functions handle all migrations that existed before we started tracking version numbers.
 */

export const legacyLocalStorageMigration = async () => {
  const oldTransactions = localStorage.getItem('redux_localstorage_simple_transactions')
  const oldUser = localStorage.getItem('redux_localstorage_simple_user')
  const oldLists = localStorage.getItem('redux_localstorage_simple_lists')
  const oldSignatures = localStorage.getItem('redux_localstorage_simple_signatures')

  const newTransactions = tryParseOldState(oldTransactions, initialTransactionsState)
  const newUser = tryParseOldState(oldUser, initialUserState)
  const newLists = tryParseOldState(oldLists, initialListsState)
  const newSignatures = tryParseOldState(oldSignatures, {})

  const result = {
    user: legacyUserMigrations(newUser),
    transactions: legacyTransactionMigrations(newTransactions),
    lists: newLists,
    signatures: newSignatures,
    _persist: { version: 0, rehydrated: true },
  }

  await persistor.flush()

  localStorage.removeItem('redux_localstorage_simple_transactions')
  localStorage.removeItem('redux_localstorage_simple_user')
  localStorage.removeItem('redux_localstorage_simple_lists')
  localStorage.removeItem('redux_localstorage_simple_signatures')
  return result
}

function legacyTransactionMigrations(state: any): LocalWebTransactionState {
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

function legacyUserMigrations(state: any): UserState {
  // Make a copy of the object so we can mutate it.
  const result = JSON.parse(JSON.stringify(state))
  // If `selectedWallet` is a WalletConnect v1 wallet, reset to default.
  if (result.selectedWallet) {
    const selectedWallet = result.selectedWallet as string
    if (selectedWallet === 'UNIWALLET' || selectedWallet === 'UNISWAP_WALLET' || selectedWallet === 'WALLET_CONNECT') {
      delete result.selectedWallet
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
    result.userRouterPreference = RouterPreference.X
  }

  // If `userRouterPreference` is `AUTO`, migrate to `X`
  if ((result.userRouterPreference as string) === 'auto') {
    result.userRouterPreference = RouterPreference.X
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
