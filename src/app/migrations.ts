// Type information currently gets lost after a migration
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import dayjs from 'dayjs'
import { ChainId } from 'src/constants/chains'
import { ChainsState } from 'src/features/chains/chainsSlice'
import { ensApi } from 'src/features/ens/api'
import { ModalName } from 'src/features/telemetry/constants'
import { TransactionState } from 'src/features/transactions/slice'
import {
  ChainIdToTxIdToDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { DEMO_ACCOUNT_ADDRESS } from 'src/features/wallet/accounts/useTestAccount'
import { toSupportedChainId } from 'src/utils/chainId'

export const migrations = {
  0: (state: any) => {
    const oldTransactionState = state?.transactions
    const newTransactionState: any = {}

    const chainIds = Object.keys(oldTransactionState?.byChainId ?? {})
    for (const chainId of chainIds) {
      const transactions = oldTransactionState.byChainId?.[chainId] ?? []
      const txIds = Object.keys(transactions)
      for (const txId of txIds) {
        const txDetails = transactions[txId]
        const address = txDetails.from
        newTransactionState[address] ??= {}
        newTransactionState[address][chainId] ??= {}
        newTransactionState[address][chainId][txId] = { ...txDetails }
      }
    }

    const oldNotificationState = state.notifications
    const newNotificationState = { ...oldNotificationState, lastTxNotificationUpdate: {} }
    const addresses = Object.keys(oldTransactionState?.lastTxHistoryUpdate || [])
    for (const address of addresses) {
      newNotificationState.lastTxNotificationUpdate[address] = {
        [ChainId.Mainnet]: oldTransactionState.lastTxHistoryUpdate[address],
      }
    }

    return { ...state, transactions: newTransactionState, notifications: newNotificationState }
  },

  1: (state: any) => {
    const newState = { ...state }
    delete newState.walletConnect?.modalState
    return newState
  },

  2: (state: any) => {
    const newState = { ...state }
    const oldFollowingAddresses = state?.favorites?.followedAddresses
    if (oldFollowingAddresses) newState.favorites.watchedAddresses = oldFollowingAddresses
    delete newState?.favorites?.followedAddresses
    return newState
  },

  3: (state: any) => {
    const newState = { ...state }
    newState.searchHistory = { results: [] }
    return newState
  },

  4: (state: any) => {
    const newState = { ...state }
    const accounts = newState?.wallet?.accounts ?? {}
    let derivationIndex = 0
    for (const account of Object.keys(accounts)) {
      newState.wallet.accounts[account].timeImportedMs = dayjs().valueOf()
      if (newState.wallet.accounts[account].type === 'native') {
        newState.wallet.accounts[account].derivationIndex = derivationIndex
        derivationIndex += 1
      }
    }
    return newState
  },

  5: (state: any) => {
    const newState = { ...state }
    newState.modals = {
      [ModalName.WalletConnectScan]: {
        isOpen: false,
        initialState: 0,
      },
      [ModalName.Swap]: {
        isOpen: false,
        initialState: undefined,
      },
      [ModalName.Send]: {
        isOpen: false,
        initialState: undefined,
      },
    }

    delete newState?.balances
    return newState
  },

  6: (state: any) => {
    const newState = { ...state }
    newState.walletConnect = { ...newState.walletConnect, pendingSession: null }
    newState.wallet = { ...newState.wallet, settings: {} }

    delete newState?.wallet?.bluetooth
    return newState
  },

  7: (state: any) => {
    const newState = { ...state }
    const accounts = newState?.wallet?.accounts ?? {}
    const originalAccountValues = Object.keys(accounts)
    for (const account of originalAccountValues) {
      if (accounts[account].type === 'native' && accounts[account].derivationIndex !== 0) {
        delete accounts[account]
      } else if (accounts[account].type === 'native' && accounts[account].derivationIndex === 0) {
        accounts[account].mnemonicId = accounts[account].address
      }
    }
    return newState
  },

  8: (state: any) => {
    const newState = { ...state }
    newState.cloudBackup = { backupsFound: [] }
    return newState
  },

  9: (state: any) => {
    const newState = { ...state }
    const accounts = newState?.wallet?.accounts ?? {}
    for (const account of Object.keys(accounts)) {
      if (newState.wallet.accounts[account].type === 'local') {
        delete newState.wallet.accounts[account]
      }
    }
    return newState
  },

  10: (state: any) => {
    const newState = { ...state }
    const accounts = newState?.wallet?.accounts ?? {}

    if (accounts[DEMO_ACCOUNT_ADDRESS]) {
      delete accounts[DEMO_ACCOUNT_ADDRESS]
    }

    return newState
  },

  11: (state: any) => {
    const newState = { ...state }
    newState.biometricSettings = {
      requiredForAppAccess: false,
      requiredForTransactions: false,
    }

    return newState
  },

  12: (state: any) => {
    const accounts: Record<Address, Account> | undefined = state?.wallet?.accounts
    const newAccounts = Object.values(accounts ?? {}).map((account: Account) => {
      const newAccount = { ...account }
      newAccount.pushNotificationsEnabled = false
      return newAccount
    })

    const newAccountObj = newAccounts.reduce<Record<Address, Account>>((accountObj, account) => {
      accountObj[account.address] = account
      return accountObj
    }, {})

    const newState = { ...state }
    newState.wallet = { ...state.wallet, accounts: newAccountObj }
    return newState
  },

  13: (state: any) => {
    const newState = { ...state }
    newState.ens = { ensForAddress: {} }
    return newState
  },

  14: (state: any) => {
    const newState = { ...state }
    newState.biometricSettings = {
      requiredForAppAccess: state.wallet.isBiometricAuthEnabled,
      requiredForTransactions: state.wallet.isBiometricAuthEnabled,
    }
    delete newState.wallet?.isBiometricAuthEnabled
    return newState
  },

  15: (state: any) => {
    const newState = { ...state }
    const accounts = newState?.wallet?.accounts ?? {}
    for (const account of Object.keys(accounts)) {
      if (newState.wallet.accounts[account].type === 'native') {
        newState.wallet.accounts[account].type = AccountType.SignerMnemonic
      }
    }
    return newState
  },

  16: (state: any) => {
    const newState = { ...state }
    delete newState.dataApi
    return newState
  },

  17: (state: any) => {
    const accounts: Record<Address, Account> | undefined = state?.wallet?.accounts
    if (!accounts) return

    for (const account of Object.values(accounts)) {
      account.pushNotificationsEnabled = false
    }

    const newState = { ...state }
    newState.wallet = { ...state.wallet, accounts }
    return newState
  },

  18: (state: any) => {
    const newState = { ...state }
    delete newState.ens
    return newState
  },

  19: (state: any) => {
    const newState = { ...state }

    const chainState: ChainsState | undefined = newState?.chains
    const newChainState = Object.keys(chainState?.byChainId ?? {}).reduce<ChainsState>(
      (tempState, chainIdString) => {
        const chainId = toSupportedChainId(chainIdString)
        if (!chainId) return tempState

        const chainInfo = chainState?.byChainId[chainId]
        if (!chainInfo) return tempState

        tempState.byChainId[chainId] = chainInfo
        return tempState
      },
      { byChainId: {} }
    )

    const blockState: any | undefined = newState?.blocks
    const newBlockState = Object.keys(blockState?.byChainId ?? {}).reduce<any>(
      (tempState, chainIdString) => {
        const chainId = toSupportedChainId(chainIdString)
        if (!chainId) return tempState

        const blockInfo = blockState?.byChainId[chainId]
        if (!blockInfo) return tempState

        tempState.byChainId[chainId] = blockInfo
        return tempState
      },
      { byChainId: {} }
    )

    const transactionState: TransactionState | undefined = newState?.transactions
    const newTransactionState = Object.keys(transactionState ?? {}).reduce<TransactionState>(
      (tempState, address) => {
        const txs = transactionState?.[address]
        if (!txs) return tempState

        const newAddressTxState = Object.keys(txs).reduce<ChainIdToTxIdToDetails>(
          (tempAddressState, chainIdString) => {
            const chainId = toSupportedChainId(chainIdString)
            if (!chainId) return tempAddressState

            const txInfo = txs[chainId]
            if (!txInfo) return tempAddressState

            tempAddressState[chainId] = txInfo
            return tempAddressState
          },
          {}
        )

        tempState[address] = newAddressTxState
        return tempState
      },
      {}
    )

    return {
      ...newState,
      chains: newChainState,
      blocks: newBlockState,
      transactions: newTransactionState,
    }
  },

  20: (state: any) => {
    const newState = { ...state }
    newState.notifications = { ...state?.notifications, lastTxNotificationUpdate: {} }
    return newState
  },

  21: (state: any) => {
    const newState = { ...state }
    // newState.experiments = { experiments: {}, featureFlags: {} }
    return {
      ...newState,
      experiments: { experiments: {}, featureFlags: {} },
    }
  },

  22: (state: any) => {
    const newState = { ...state }
    delete newState.coingeckoApi
    delete newState.tokens?.watchedTokens
    delete newState.tokens?.tokenPairs
    return newState
  },

  23: (state: any) => {
    const newState = { ...state }
    // Reset values because of changed types for these two optional variables
    delete newState.wallet.settings?.tokensOrderBy
    delete newState.wallet.settings?.tokensMetadataDisplayType
    return newState
  },

  24: (state: any) => {
    const newState = { ...state }
    const notificationCount = state.notifications?.notificationCount
    const notificationStatus = Object.keys(notificationCount ?? {}).reduce((obj, address) => {
      const count = notificationCount[address]
      if (count) {
        return { ...obj, [address]: true }
      }

      return { ...obj, [address]: false }
    }, {})

    delete newState.notifications?.notificationCount
    newState.notifications = { ...newState.notifications, notificationStatus }
    return newState
  },

  25: (state: any) => {
    return {
      ...state,
      passwordLockout: { passwordAttempts: 0 },
    }
  },

  26: (state: any) => {
    const newState = { ...state }
    delete newState.wallet.settings.showSmallBalances
    return newState
  },

  27: (state: any) => {
    const newState = { ...state }
    // Reset tokensOrder by because of updated types of TokensOrderBy
    delete newState.wallet.settings.tokensOrderBy
    return newState
  },

  28: (state: any) => {
    const newState = { ...state }
    // Removed storing tokensMetadataDisplayType
    delete newState.wallet.settings.tokensMetadataDisplayType
    return newState
  },

  29: (state: any) => {
    const newState = { ...state }
    delete newState.tokenLists
    delete newState.tokens?.customTokens
    return newState
  },

  // Fiat onramp tx typeInfo schema changed
  // Updates every fiat onramp tx in store to new schema
  // leaves non-for txs untouched
  30: function MigrateFiatPurchaseTransactionInfo(state: any) {
    const newState = { ...state }

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
            // we iterative over very chain, need to no-op on some combinations
            continue
          }

          if (txDetails.typeInfo.type !== TransactionType.FiatPurchase) {
            newTransactionState[address] ??= {}
            newTransactionState[address][chainId] ??= {}
            newTransactionState[address][chainId][txId] = txDetails

            continue
          }

          if (txDetails.status === TransactionStatus.Failed) {
            // delete failed moonpay transactions as we do not have enough information to migrate
            continue
          }

          const {
            explorerUrl,
            outputTokenAddress,
            outputCurrencyAmountFormatted,
            outputCurrencyAmountPrice,
            syncedWithBackend,
          } = txDetails.typeInfo

          const newTypeInfo = {
            type: TransactionType.FiatPurchase,
            explorerUrl,
            inputCurrency: undefined,
            inputCurrencyAmount: outputCurrencyAmountFormatted / outputCurrencyAmountPrice,
            outputCurrency: {
              type: 'crypto',
              metadata: { chainId: undefined, contractAddress: outputTokenAddress },
            },
            outputCurrencyAmount: undefined,
            syncedWithBackend,
          }

          newTransactionState[address] ??= {}
          newTransactionState[address][chainId] ??= {}
          newTransactionState[address][chainId][txId] = { ...txDetails, typeInfo: newTypeInfo }
        }
      }
    }

    return { ...newState, transactions: newTransactionState }
  },

  31: function emptyMigration(state: any) {
    // no persisted state removed but need to update schema
    return state
  },

  32: function resetEnsApi(state: any) {
    const newState = { ...state }

    delete newState[ensApi.reducerPath]

    return newState
  },

  33: function addReplaceAccount(state: any) {
    const newState = { ...state }

    newState.wallet.replaceAccountOptions = {
      isReplacingAccount: false,
      skipToSeedPhrase: false,
    }
    return newState
  },
}
