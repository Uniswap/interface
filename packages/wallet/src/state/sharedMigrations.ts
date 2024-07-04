/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'

// Mobile: 63
// Extension: 0
export function removeWalletIsUnlockedState(state: any): any {
  const newState = { ...state }
  delete newState?.wallet?.isUnlocked

  return newState
}

// Mobile: 64
// Extension: 1
export function removeUniconV2BehaviorState(state: any): any {
  const newState = { ...state }
  delete newState?.behaviorHistory?.hasViewedUniconV2IntroModal
  return newState
}

// Mobile: 65
// Extension: 2
export function addRoutingFieldToTransactions(state: any): any {
  const oldTransactionState = state?.transactions
  const newTransactionState: any = {}

  const addresses = Object.keys(oldTransactionState ?? {})
  for (const address of addresses) {
    const chainIds = Object.keys(oldTransactionState[address] ?? {})
    for (const chainId of chainIds) {
      const transactions = oldTransactionState[address][chainId]
      const txIds = Object.keys(transactions ?? {})

      for (const txId of txIds) {
        const txDetails = transactions[txId]

        if (!txDetails) {
          // we iterate over every chain, need to no-op on some combinations
          continue
        }

        txDetails.options ??= { request: {} }

        newTransactionState[address] ??= {}
        newTransactionState[address][chainId] ??= {}
        // 'CLASSIC' comes from trading API Routing.Classic enum. It is hardcoded here as a string for safety incase the enum changes.
        newTransactionState[address][chainId][txId] = { routing: 'CLASSIC', ...txDetails }
      }
    }
  }
  return { ...state, transactions: newTransactionState }
}

// Mobile: 66
// Extension: 3
// Activates redux pending accounts as a result of migration to OnbardingContext.tsx. Migration rulses:
// 1. if there’s a view only pending account, always activate it
// 2. if there’s a signer pending account and it
//     a. has the same mnemonic id as the active account, always activate it unless:
//         1. if there’s more than 6, only activate the oldest/newest 3. delete the rest
//     b. has a different mnemonic id as the active account, always delete it
export function activatePendingAccounts(state: any): any {
  if (!state.wallet) {
    return state
  }

  const MAX_WALLET_IMPORT = 6

  const { accounts } = state.wallet
  const { activeAccountAddress } = state.wallet
  const activeAccount = accounts[activeAccountAddress]

  const getActiveSignerAccountWalletsForActivation = (): string[] => {
    if (!activeAccountAddress || !activeAccount || activeAccount.type === AccountType.Readonly) {
      return []
    }

    const activeSignerAccountPendingWallets = Object.values(accounts).filter(
      (account: any) =>
        account.type === AccountType.SignerMnemonic &&
        account.mnemonicId === activeAccount.mnemonicId &&
        account.pending === true,
    )

    if (activeSignerAccountPendingWallets.length > MAX_WALLET_IMPORT) {
      // sorted active signer account pending addresses from the oldest to the newest
      const sortedActiveSignerAccountPendingWallets = activeSignerAccountPendingWallets
        .sort((a: any, b: any) => a.timeImportedMs - b.timeImportedMs)
        .map((account: any) => account.address)

      const firstThreeAndLastThreeAddresses = [
        ...sortedActiveSignerAccountPendingWallets.slice(0, MAX_WALLET_IMPORT / 2),
        ...sortedActiveSignerAccountPendingWallets.slice(-MAX_WALLET_IMPORT / 2),
      ]
      return firstThreeAndLastThreeAddresses
    } else {
      return activeSignerAccountPendingWallets.map((account: any) => account.address)
    }
  }

  const pendingSignerAccountsForActivation = getActiveSignerAccountWalletsForActivation()

  const isActiveSignerAccountPendingWalletForActivation = (account: Account): boolean =>
    pendingSignerAccountsForActivation.includes(account.address)

  const isNonPendingSignerAccount = (account: any): boolean =>
    account.type === AccountType.SignerMnemonic && !account.pending

  const isReadOnlyAccount = (account: any): boolean => account.type === AccountType.Readonly

  const isCurrentlyActive = (account: any): boolean => account.address === activeAccountAddress

  const filteredNonPendingAccounts = {} as any

  Object.values(accounts).forEach((account: any) => {
    if (
      isActiveSignerAccountPendingWalletForActivation(account) ||
      isNonPendingSignerAccount(account) ||
      isReadOnlyAccount(account) ||
      isCurrentlyActive(account)
    ) {
      delete account.pending
      filteredNonPendingAccounts[account.address] = account
    }
  })

  const firstActiveWalletAddress = Object.keys(filteredNonPendingAccounts)[0]
  const isAnyWallet = Object.keys(filteredNonPendingAccounts).length > 0

  return {
    ...state,
    wallet: {
      ...state.wallet,
      activeAccountAddress: isAnyWallet ? activeAccountAddress || firstActiveWalletAddress : null,
      accounts: filteredNonPendingAccounts,
    },
  }
}
