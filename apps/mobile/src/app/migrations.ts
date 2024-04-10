// Type information currently gets lost after a migration
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines */

import dayjs from 'dayjs'
import { ChainId } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { AccountToNftData } from 'wallet/src/features/favorites/slice'
import { initialFiatCurrencyState } from 'wallet/src/features/fiatCurrency/slice'
import { initialLanguageState } from 'wallet/src/features/language/slice'
import { getNFTAssetKey } from 'wallet/src/features/nfts/utils'
import { TransactionStateMap } from 'wallet/src/features/transactions/slice'
import {
  ChainIdToTxIdToDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { ModalName } from 'wallet/src/telemetry/constants'

export const OLD_DEMO_ACCOUNT_ADDRESS = '0xdd0E380579dF30E38524F9477808d9eE37E2dEa6'

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
    if (oldFollowingAddresses) {
      newState.favorites.watchedAddresses = oldFollowingAddresses
    }
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

    if (accounts[OLD_DEMO_ACCOUNT_ADDRESS]) {
      delete accounts[OLD_DEMO_ACCOUNT_ADDRESS]
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
    if (!accounts) {
      return
    }

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

    const chainState:
      | {
          byChainId: Partial<Record<ChainId, { isActive: boolean }>>
        }
      | undefined = newState?.chains
    const newChainState = Object.keys(chainState?.byChainId ?? {}).reduce<{
      byChainId: Partial<Record<ChainId, { isActive: boolean }>>
    }>(
      (tempState, chainIdString) => {
        const chainId = toSupportedChainId(chainIdString)
        if (!chainId) {
          return tempState
        }

        const chainInfo = chainState?.byChainId[chainId]
        if (!chainInfo) {
          return tempState
        }

        tempState.byChainId[chainId] = chainInfo
        return tempState
      },
      { byChainId: {} }
    )

    const blockState: any | undefined = newState?.blocks
    const newBlockState = Object.keys(blockState?.byChainId ?? {}).reduce<any>(
      (tempState, chainIdString) => {
        const chainId = toSupportedChainId(chainIdString)
        if (!chainId) {
          return tempState
        }

        const blockInfo = blockState?.byChainId[chainId]
        if (!blockInfo) {
          return tempState
        }

        tempState.byChainId[chainId] = blockInfo
        return tempState
      },
      { byChainId: {} }
    )

    const transactionState: TransactionStateMap | undefined = newState?.transactions
    const newTransactionState = Object.keys(transactionState ?? {}).reduce<TransactionStateMap>(
      (tempState, address) => {
        const txs = transactionState?.[address]
        if (!txs) {
          return tempState
        }

        const newAddressTxState = Object.keys(txs).reduce<ChainIdToTxIdToDetails>(
          (tempAddressState, chainIdString) => {
            const chainId = toSupportedChainId(chainIdString)
            if (!chainId) {
              return tempAddressState
            }

            const txInfo = txs[chainId]
            if (!txInfo) {
              return tempAddressState
            }

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

    delete newState.ENS

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

  34: function addLastBalancesReport(state: any) {
    const newState = { ...state }

    newState.telemetry = {
      lastBalancesReport: 0,
    }
    return newState
  },

  35: function addAppearanceSetting(state: any) {
    const newState = { ...state }

    newState.appearanceSettings = {
      selectedAppearanceSettings: 'system',
    }
    return newState
  },

  36: function addNfts(state: any) {
    const newState = { ...state }

    newState.favorites = {
      ...state.favorites,
      hiddenNfts: {},
    }
    return newState
  },
  37: function correctFailedFiatOnRampTxIds(state: any) {
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
            // we iterate over every chain, need to no-op on some combinations
            continue
          }

          newTransactionState[address] ??= {}
          newTransactionState[address][chainId] ??= {}
          newTransactionState[address][chainId][txId] =
            txDetails.typeInfo.type === TransactionType.FiatPurchase &&
            txDetails.status === TransactionStatus.Failed
              ? {
                  ...txDetails,
                  typeInfo: {
                    ...txDetails.typeInfo,
                    id: txDetails.typeInfo?.explorerUrl?.split('=')?.[1],
                  },
                }
              : txDetails
        }
      }
    }
    return { ...newState, transactions: newTransactionState }
  },
  38: function removeReplaceAccountOptions(state: any) {
    const newState = { ...state }
    delete newState.wallet.replaceAccountOptions
    return newState
  },
  39: function removeExperimentsSlice(state: any) {
    const newState = { ...state }
    delete newState.experiments
    return newState
  },
  40: function removePersistedWalletConnectSlice(state: any) {
    // Remove `walletConnect` slice from persisted whitelist
    const newState = { ...state }
    delete newState.walletConnect
    return newState
  },

  41: function addLastBalancesReportValue(state: any) {
    const newState = { ...state }

    newState.telemetry = {
      ...state.telemetry,
      lastBalancesReportValue: 0,
    }
    return newState
  },

  42: function removeFlashbotsEnabledFromWalletSlice(state: any) {
    const newState = { ...state }

    delete newState.wallet.flashbotsEnabled

    return newState
  },

  43: function convertHiddenNftsToNftsData(state: any) {
    // see its test to get a better idea of what this migration does
    const newState = { ...state }

    const accountAddresses = Object.keys(state.favorites?.hiddenNfts ?? {})

    const nftsData: AccountToNftData = {}
    for (const accountAddress of accountAddresses) {
      nftsData[accountAddress] ??= {}
      const hiddenNftKeys = Object.keys(state.favorites.hiddenNfts[accountAddress])

      for (const hiddenNftKey of hiddenNftKeys) {
        const [, nftKey, tokenId] = hiddenNftKey.split('.')

        // we need to convert NFTs key to the new all not checksummed version
        const newNftKey = nftKey && tokenId && getNFTAssetKey(nftKey, tokenId)

        const accountNftsData = nftsData[accountAddress]
        if (newNftKey && accountNftsData) {
          accountNftsData[newNftKey] = { isHidden: true }
        }
      }
    }

    newState.favorites = {
      ...state.favorites,
      nftsData,
    }
    delete newState.favorites.hiddenNfts
    return newState
  },

  44: function removeProviders(state: any) {
    const newState = { ...state }

    delete newState.providers

    return newState
  },

  45: function addTokensData(state: any) {
    const newState = { ...state }

    newState.favorites = {
      ...state.favorites,
      tokensVisibility: {},
    }
    return newState
  },

  46: function deleteRTKQuerySlices(state: any) {
    const newState = { ...state }

    delete newState.ENS
    delete newState.ens
    delete newState.gasApi
    delete newState.onChainBalanceApi
    delete newState.routingApi
    delete newState.trmApi

    return newState
  },

  47: function resetActiveChains(state: any) {
    const newState = { ...state }

    newState.chains.byChainId = {
      '1': { isActive: true },
      '10': { isActive: true },
      '56': { isActive: true },
      '137': { isActive: true },
      '8453': { isActive: true },
      '42161': { isActive: true },
    }

    return newState
  },

  48: function addTweakStartingState(state: any) {
    const newState = { ...state }

    newState.tweaks = {}

    return newState
  },

  49: function addSwapProtectionSetting(state: any) {
    const newState = { ...state }
    newState.wallet.settings = {
      ...state.wallet.settings,
      swapProtection: SwapProtectionSetting.On,
    }
    return newState
  },

  50: function deleteChainsSlice(state: any) {
    const newState = { ...state }
    delete newState.chains
    return newState
  },

  51: function addLanguageSettings(state: any) {
    return {
      ...state,
      languageSettings: initialLanguageState,
    }
  },

  52: function addFiatCurrencySettings(state: any) {
    return {
      ...state,
      fiatCurrencySettings: initialFiatCurrencyState,
    }
  },

  53: function updateLanguageSettings(state: any) {
    return {
      ...state,
      languageSettings: initialLanguageState,
    }
  },

  54: function addWalletIsFunded(state: any) {
    const newState = { ...state }

    newState.telemetry = {
      ...state.telemetry,
      walletIsFunded: false,
    }

    return newState
  },

  55: function addBehaviorHistory(state: any) {
    const newState = { ...state }

    newState.behaviorHistory = {
      hasViewedReviewScreen: false,
      hasSubmittedHoldToSwap: false,
    }

    return newState
  },

  56: function addAllowAnalyticsSwitch(state: any) {
    const newState = { ...state }

    newState.telemetry = {
      ...state.telemetry,
      allowAnalytics: true,
      lastHeartbeat: 0,
    }

    return newState
  },

  57: function moveSettingStateToGlobal(state: any) {
    const newState = { ...state }

    // get old accounts
    const accounts = newState?.wallet?.accounts ?? {}
    const firstAccountKey = Object.keys(accounts)[0]

    // Read setting from the first wallet, or assign default value
    const hideSmallBalances = firstAccountKey ? !accounts[firstAccountKey].showSmallBalances : true // default to true
    const hideSpamTokens = firstAccountKey ? !accounts[firstAccountKey].showSpamTokens : true // default to true

    newState.wallet.settings.hideSmallBalances = hideSmallBalances
    newState.wallet.settings.hideSpamTokens = hideSpamTokens

    // delete old account specific state
    const accountKeys = Object.keys(accounts ?? {})
    for (const accountKey of accountKeys) {
      delete accounts[accountKey].showSmallBalances
      delete accounts[accountKey].showSpamTokens
    }

    return newState
  },

  58: function addSkippedUnitagBoolean(state: any) {
    const newState = { ...state }

    newState.behaviorHistory = {
      ...state.behaviorHistory,
      hasSkippedUnitagPrompt: false,
    }

    return newState
  },

  59: function addCompletedUnitagsIntroBoolean(state: any) {
    const newState = { ...state }

    newState.behaviorHistory = {
      ...state.behaviorHistory,
      hasCompletedUnitagsIntroModal: false,
    }

    return newState
  },

  60: function addUniconV2IntroModalBoolean(state: any) {
    const newState = { ...state }

    newState.behaviorHistory = {
      ...state.behaviorHistory,
      hasViewedUniconV2IntroModal: false,
    }

    return newState
  },
}
