// Type information currently gets lost after a migration
// biome-ignore-all lint/suspicious/noExplicitAny: Migration logic requires flexible typing
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable max-lines */

import dayjs from 'dayjs'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { type TransactionsState } from 'uniswap/src/features/transactions/slice'
import {
  type ChainIdToTxIdToDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { createSafeMigrationFactory } from 'uniswap/src/state/createSafeMigration'
import { DappRequestType } from 'uniswap/src/types/walletConnect'
import { type Account } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

const createSafeMigration = createSafeMigrationFactory('mobileMigrations')

export const OLD_DEMO_ACCOUNT_ADDRESS = '0xdd0E380579dF30E38524F9477808d9eE37E2dEa6'

export const restructureTransactionsAndNotifications = createSafeMigration({
  name: 'restructureTransactionsAndNotifications',
  migrate: (state: any) => {
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
        [UniverseChainId.Mainnet]: oldTransactionState.lastTxHistoryUpdate[address],
      }
    }

    return { ...state, transactions: newTransactionState, notifications: newNotificationState }
  },
  onError: (state: any) => ({
    ...state,
    transactions: {},
    notifications: { ...state.notifications, lastTxNotificationUpdate: {} },
  }),
})

export function removeWalletConnectModalState(state: any) {
  const newState = { ...state }
  delete newState.walletConnect?.modalState
  return newState
}

export function renameFollowedAddressesToWatchedAddresses(state: any) {
  const newState = { ...state }
  const oldFollowingAddresses = state?.favorites?.followedAddresses
  if (oldFollowingAddresses) {
    newState.favorites.watchedAddresses = oldFollowingAddresses
  }
  delete newState?.favorites?.followedAddresses
  return newState
}

export function addSearchHistory(state: any) {
  const newState = { ...state }
  newState.searchHistory = { results: [] }
  return newState
}

export function addTimeImportedAndDerivationIndex(state: any) {
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
}

export function addModalsState(state: any) {
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
}

export function addWalletConnectPendingSessionAndSettings(state: any) {
  const newState = { ...state }
  newState.walletConnect = { ...newState.walletConnect, pendingSession: null }
  newState.wallet = { ...newState.wallet, settings: {} }

  delete newState?.wallet?.bluetooth
  return newState
}

export function removeNonZeroDerivationIndexAccounts(state: any) {
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
}

export function addCloudBackup(state: any) {
  const newState = { ...state }
  newState.cloudBackup = { backupsFound: [] }
  return newState
}

export function removeLocalTypeAccounts(state: any) {
  const newState = { ...state }
  const accounts = newState?.wallet?.accounts ?? {}
  for (const account of Object.keys(accounts)) {
    if (newState.wallet?.accounts?.[account]?.type === 'local') {
      delete newState.wallet.accounts[account]
    }
  }
  return newState
}

export function removeDemoAccount(state: any) {
  const newState = { ...state }
  const accounts = newState?.wallet?.accounts ?? {}

  if (accounts[OLD_DEMO_ACCOUNT_ADDRESS]) {
    delete accounts[OLD_DEMO_ACCOUNT_ADDRESS]
  }

  return newState
}

export function addBiometricSettings(state: any) {
  const newState = { ...state }
  newState.biometricSettings = {
    requiredForAppAccess: false,
    requiredForTransactions: false,
  }

  return newState
}

export function addPushNotificationsEnabledToAccounts(state: any) {
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
}

export function addEnsState(state: any) {
  const newState = { ...state }
  newState.ens = { ensForAddress: {} }
  return newState
}

export const migrateBiometricSettings = createSafeMigration({
  name: 'migrateBiometricSettings',
  migrate: (state: any) => {
    const newState = { ...state }
    newState.biometricSettings = {
      requiredForAppAccess: state.wallet?.isBiometricAuthEnabled ?? false,
      requiredForTransactions: state.wallet?.isBiometricAuthEnabled ?? false,
    }
    delete newState.wallet?.isBiometricAuthEnabled
    return newState
  },
  onError: (state: any) => ({
    ...state,
    biometricSettings: {
      requiredForAppAccess: false,
      requiredForTransactions: false,
    },
  }),
})

export function changeNativeTypeToSignerMnemonic(state: any) {
  const newState = { ...state }
  const accounts = newState?.wallet?.accounts ?? {}
  for (const account of Object.keys(accounts)) {
    if (newState.wallet.accounts[account].type === 'native') {
      newState.wallet.accounts[account].type = AccountType.SignerMnemonic
    }
  }
  return newState
}

export function removeDataApi(state: any) {
  const newState = { ...state }
  delete newState.dataApi
  return newState
}

export function resetPushNotificationsEnabled(state: any) {
  const accounts: Record<Address, Account> | undefined = state?.wallet?.accounts
  if (!accounts) {
    return state
  }

  for (const account of Object.values(accounts)) {
    account.pushNotificationsEnabled = false
  }

  const newState = { ...state }
  newState.wallet = { ...state.wallet, accounts }
  return newState
}

export function removeEnsState(state: any) {
  const newState = { ...state }
  delete newState.ens
  return newState
}

export function filterToSupportedChains(state: any) {
  const newState = { ...state }

  const chainState:
    | {
        byChainId: Partial<Record<UniverseChainId, { isActive: boolean }>>
      }
    | undefined = newState?.chains
  const newChainState = Object.keys(chainState?.byChainId ?? {}).reduce<{
    byChainId: Partial<Record<UniverseChainId, { isActive: boolean }>>
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
    { byChainId: {} },
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
    { byChainId: {} },
  )

  const transactionState: TransactionsState | undefined = newState?.transactions
  const newTransactionState = Object.keys(transactionState ?? {}).reduce<TransactionsState>((tempState, address) => {
    const txs = transactionState?.[address]
    if (!txs) {
      return tempState
    }

    const newAddressTxState = Object.keys(txs).reduce<ChainIdToTxIdToDetails>((tempAddressState, chainIdString) => {
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
    }, {})

    tempState[address] = newAddressTxState
    return tempState
  }, {})

  return {
    ...newState,
    chains: newChainState,
    blocks: newBlockState,
    transactions: newTransactionState,
  }
}

export function resetLastTxNotificationUpdate(state: any) {
  const newState = { ...state }
  newState.notifications = { ...state?.notifications, lastTxNotificationUpdate: {} }
  return newState
}

export function addExperimentsSlice(state: any) {
  const newState = { ...state }
  return {
    ...newState,
    experiments: { experiments: {}, featureFlags: {} },
  }
}

export function removeCoingeckoApiAndTokenLists(state: any) {
  const newState = { ...state }
  delete newState.coingeckoApi
  delete newState.tokens?.watchedTokens
  delete newState.tokens?.tokenPairs
  return newState
}

export function resetTokensOrderByAndMetadataDisplayType(state: any) {
  const newState = { ...state }
  delete newState.wallet.settings?.tokensOrderBy
  delete newState.wallet.settings?.tokensMetadataDisplayType
  return newState
}

export const transformNotificationCountToStatus = createSafeMigration({
  name: 'transformNotificationCountToStatus',
  migrate: (state: any) => {
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
  onError: (state: any) => ({
    ...state,
    notifications: { ...state?.notifications, notificationStatus: {} },
  }),
})

export function addPasswordLockout(state: any) {
  return {
    ...state,
    passwordLockout: { passwordAttempts: 0 },
  }
}

export function removeShowSmallBalances(state: any) {
  const newState = { ...state }
  delete newState.wallet.settings.showSmallBalances
  return newState
}

export function resetTokensOrderBy(state: any) {
  const newState = { ...state }
  delete newState.wallet.settings.tokensOrderBy
  return newState
}

export function removeTokensMetadataDisplayType(state: any) {
  const newState = { ...state }
  delete newState.wallet.settings.tokensMetadataDisplayType
  return newState
}

export function removeTokenListsAndCustomTokens(state: any) {
  const newState = { ...state }
  delete newState.tokenLists
  delete newState.tokens?.customTokens
  return newState
}

export const migrateFiatPurchaseTransactionInfo = createSafeMigration({
  name: 'migrateFiatPurchaseTransactionInfo',
  migrate: (state: any) => {
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
            continue
          }

          if (txDetails.typeInfo?.type !== TransactionType.FiatPurchaseDeprecated) {
            newTransactionState[address] ??= {}
            newTransactionState[address][chainId] ??= {}
            newTransactionState[address][chainId][txId] = txDetails

            continue
          }

          if (txDetails.status === TransactionStatus.Failed) {
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
            type: TransactionType.FiatPurchaseDeprecated,
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
  onError: (state: any) => ({ ...state, transactions: {} }),
})

export function emptyMigration(state: any) {
  return state
}

export function resetEnsApi(state: any) {
  const newState = { ...state }

  delete newState.ENS

  return newState
}

export function addReplaceAccountOptions(state: any) {
  const newState = { ...state }

  newState.wallet.replaceAccountOptions = {
    isReplacingAccount: false,
    skipToSeedPhrase: false,
  }
  return newState
}

export function addLastBalancesReport(state: any) {
  const newState = { ...state }

  newState.telemetry = {
    lastBalancesReport: 0,
  }
  return newState
}

export function addAppearanceSetting(state: any) {
  const newState = { ...state }

  newState.appearanceSettings = {
    selectedAppearanceSettings: 'system',
  }
  return newState
}

export function addHiddenNfts(state: any) {
  const newState = { ...state }

  newState.favorites = {
    ...state.favorites,
    hiddenNfts: {},
  }
  return newState
}

export const correctFailedFiatOnRampTxIds = createSafeMigration({
  name: 'correctFailedFiatOnRampTxIds',
  migrate: (state: any) => {
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
            continue
          }

          newTransactionState[address] ??= {}
          newTransactionState[address][chainId] ??= {}
          newTransactionState[address][chainId][txId] =
            txDetails.typeInfo?.type === TransactionType.FiatPurchaseDeprecated &&
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
  onError: (state: any) => ({ ...state, transactions: {} }),
})

export function removeReplaceAccountOptions(state: any) {
  const newState = { ...state }
  delete newState.wallet.replaceAccountOptions
  return newState
}

export function removeExperimentsSlice(state: any) {
  const newState = { ...state }
  delete newState.experiments
  return newState
}

export function removePersistedWalletConnectSlice(state: any) {
  const newState = { ...state }
  delete newState.walletConnect
  return newState
}

export function addLastBalancesReportValue(state: any) {
  const newState = { ...state }

  newState.telemetry = {
    ...state.telemetry,
    lastBalancesReportValue: 0,
  }
  return newState
}

export function removeFlashbotsEnabledFromWalletSlice(state: any) {
  const newState = { ...state }

  delete newState.wallet.flashbotsEnabled

  return newState
}

export const convertHiddenNftsToNftsData = createSafeMigration({
  name: 'convertHiddenNftsToNftsData',
  migrate: (state: any) => {
    const newState = { ...state }

    const accountAddresses = Object.keys(state.favorites?.hiddenNfts ?? {})

    type AccountToNftData = Record<Address, Record<string, { isSpamIgnored?: boolean; isHidden?: boolean }>>

    const nftsData: AccountToNftData = {}
    for (const accountAddress of accountAddresses) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      nftsData[accountAddress] ??= {}
      const hiddenNftKeys = Object.keys(state.favorites.hiddenNfts[accountAddress])

      for (const hiddenNftKey of hiddenNftKeys) {
        const [, nftKey, tokenId] = hiddenNftKey.split('.')

        const newNftKey = nftKey && tokenId && getNFTAssetKey(nftKey, tokenId)

        const accountNftsData = nftsData[accountAddress]

        if (newNftKey) {
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
  onError: (state: any) => ({
    ...state,
    favorites: {
      ...state?.favorites,
      nftsData: {},
    },
  }),
})

export function removeProviders(state: any) {
  const newState = { ...state }

  delete newState.providers

  return newState
}

export function addTokensVisibility(state: any) {
  const newState = { ...state }

  newState.favorites = {
    ...state.favorites,
    tokensVisibility: {},
  }
  return newState
}

export function deleteRTKQuerySlices(state: any) {
  const newState = { ...state }

  delete newState.ENS
  delete newState.ens
  delete newState.gasApi
  delete newState.onChainBalanceApi
  delete newState.routingApi
  delete newState.trmApi

  return newState
}

export function resetActiveChains(state: any) {
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
}

export function addTweaksStartingState(state: any) {
  const newState = { ...state }

  newState.tweaks = {}

  return newState
}

export function addSwapProtectionSetting(state: any) {
  const newState = { ...state }
  newState.wallet.settings = {
    ...state.wallet.settings,
    swapProtection: SwapProtectionSetting.On,
  }
  return newState
}

export function deleteChainsSlice(state: any) {
  const newState = { ...state }
  delete newState.chains
  return newState
}

export function addLanguageSettings(state: any) {
  return {
    ...state,
    languageSettings: { currentLanguage: Language.English },
  }
}

export function addFiatCurrencySettings(state: any) {
  return {
    ...state,
    fiatCurrencySettings: { currentCurrency: FiatCurrency.UnitedStatesDollar },
  }
}

export function updateLanguageSettings(state: any) {
  return {
    ...state,
    languageSettings: { currentLanguage: Language.English },
  }
}

export function addWalletIsFunded(state: any) {
  const newState = { ...state }

  newState.telemetry = {
    ...state.telemetry,
    walletIsFunded: false,
  }

  return newState
}

export function addBehaviorHistory(state: any) {
  const newState = { ...state }

  newState.behaviorHistory = {
    hasViewedReviewScreen: false,
    hasSubmittedHoldToSwap: false,
  }

  return newState
}

export function addAllowAnalyticsSwitch(state: any) {
  const newState = { ...state }

  newState.telemetry = {
    ...state.telemetry,
    allowAnalytics: true,
    lastHeartbeat: 0,
  }

  return newState
}

export const moveSettingStateToGlobal = createSafeMigration({
  name: 'moveSettingStateToGlobal',
  migrate: (state: any) => {
    const newState = { ...state }

    const accounts = newState?.wallet?.accounts ?? {}
    const firstAccountKey = Object.keys(accounts)[0]

    const hideSmallBalances = firstAccountKey ? !accounts[firstAccountKey].showSmallBalances : true
    const hideSpamTokens = firstAccountKey ? !accounts[firstAccountKey].showSpamTokens : true

    newState.wallet = {
      ...newState.wallet,
      settings: {
        ...newState.wallet?.settings,
        hideSmallBalances,
        hideSpamTokens,
      },
    }

    const accountKeys = Object.keys(accounts ?? {})
    for (const accountKey of accountKeys) {
      delete accounts[accountKey].showSmallBalances
      delete accounts[accountKey].showSpamTokens
    }

    return newState
  },
  onError: (state: any) => ({
    ...state,
    wallet: {
      ...state?.wallet,
      settings: {
        ...state?.wallet?.settings,
        hideSmallBalances: true,
        hideSpamTokens: true,
      },
    },
  }),
})

export function addSkippedUnitagBoolean(state: any) {
  const newState = { ...state }

  newState.behaviorHistory = {
    ...state.behaviorHistory,
    hasSkippedUnitagPrompt: false,
  }

  return newState
}

export function addCompletedUnitagsIntroBoolean(state: any) {
  const newState = { ...state }

  newState.behaviorHistory = {
    ...state.behaviorHistory,
    hasCompletedUnitagsIntroModal: false,
  }

  return newState
}

export function addUniconV2IntroModalBoolean(state: any) {
  const newState = { ...state }

  newState.behaviorHistory = {
    ...state.behaviorHistory,
    hasViewedUniconV2IntroModal: false,
  }

  return newState
}

export const flattenTokenVisibility = createSafeMigration({
  name: 'flattenTokenVisibility',
  migrate: (state: any) => {
    const newState = { ...state }

    type AccountToNftData = Record<Address, Record<string, { isSpamIgnored?: boolean; isHidden?: boolean }>>
    type NFTKeyToVisibility = Record<string, { isVisible: boolean }>

    type AccountToTokenVisibility = Record<Address, Record<string, { isVisible: boolean }>>
    type CurrencyIdToVisibility = Record<string, { isVisible: boolean }>

    const tokenVisibilityByAccount: AccountToTokenVisibility = state.favorites?.tokensVisibility ?? {}
    const flattenedTokenVisibility: CurrencyIdToVisibility = Object.values(tokenVisibilityByAccount).reduce(
      (acc, currencyIdToVisibility) => ({ ...acc, ...currencyIdToVisibility }),
      {},
    )

    const nftDataByAccount: AccountToNftData = state.favorites?.nftsData ?? {}
    const flattenedNFTData = Object.values(nftDataByAccount).reduce(
      (acc, nftIdToVisibility) => ({ ...acc, ...nftIdToVisibility }),
      {},
    )

    const flattenedTransformedNFTData: NFTKeyToVisibility = Object.keys(flattenedNFTData).reduce<NFTKeyToVisibility>(
      (acc, nftKey) => {
        const { isHidden, isSpamIgnored } = flattenedNFTData[nftKey] ?? {}
        return {
          ...acc,
          [nftKey]: { isVisible: isHidden === false || isSpamIgnored === true },
        }
      },
      {},
    )

    newState.favorites = {
      ...state.favorites,
      tokensVisibility: flattenedTokenVisibility,
      nftsVisibility: flattenedTransformedNFTData,
    }

    delete newState.favorites.nftsData

    return newState
  },
  onError: (state: any) => ({
    ...state,
    favorites: {
      ...state?.favorites,
      tokensVisibility: {},
      nftsVisibility: {},
    },
  }),
})

export function addExtensionOnboardingState(state: any) {
  const newState = { ...state }

  newState.behaviorHistory = {
    ...state.behaviorHistory,
    extensionOnboardingState: 'Undefined',
  }

  return newState
}

export function resetOnboardingStateForGA(state: any) {
  const newState = { ...state }

  newState.behaviorHistory = {
    ...state.behaviorHistory,
    extensionOnboardingState: 'Undefined',
  }

  return newState
}

export const deleteOldOnRampTxData = createSafeMigration({
  name: 'deleteOldOnRampTxData',
  migrate: (state: any) => {
    const newState = { ...state }

    const transactionsState = newState.transactions

    const addresses = Object.keys(transactionsState ?? {})
    for (const address of addresses) {
      const chainIds = Object.keys(transactionsState[address] ?? {})
      for (const chainId of chainIds) {
        const transactions = transactionsState[address][chainId]
        const txIds = Object.keys(transactions ?? {})
        for (const txId of txIds) {
          if (transactions[txId]?.typeInfo?.type === TransactionType.FiatPurchaseDeprecated) {
            delete transactionsState[address][chainId][txId]
          }
        }
      }
    }

    return { ...newState, transactions: transactionsState }
  },
  onError: (state: any) => ({ ...state, transactions: {} }),
})

export const addPushNotifications = createSafeMigration({
  name: 'addPushNotifications',
  migrate: (state: any) => {
    const hasAllWalletNotifsDisabled = Object.values(state.wallet?.accounts ?? {}).every(
      (account) =>
        account &&
        typeof account === 'object' &&
        'pushNotificationsEnabled' in account &&
        !account.pushNotificationsEnabled,
    )

    return {
      ...state,
      pushNotifications: {
        generalUpdatesEnabled: !hasAllWalletNotifsDisabled,
        priceAlertsEnabled: !hasAllWalletNotifsDisabled,
      },
    }
  },
  onError: (state: any) => ({
    ...state,
    pushNotifications: {
      generalUpdatesEnabled: true,
      priceAlertsEnabled: true,
    },
  }),
})

export const migrateDappRequestInfoTypes = createSafeMigration({
  name: 'migrateDappRequestInfoTypes',
  migrate: (state: any) => {
    const newState = { ...state }

    if (!newState?.transactions) {
      return newState
    }

    const newTransactionState = {} as Record<any, any>

    for (const [address, chainIdToTxIdToDetails] of Object.entries(newState.transactions as Record<any, any>)) {
      for (const [chainId, txIdToDetails] of Object.entries(chainIdToTxIdToDetails as Record<any, any>)) {
        for (const [txId, details] of Object.entries(txIdToDetails as Record<any, any>)) {
          let newDetails = { ...details }

          if (details.typeInfo?.externalDappInfo?.source === 'uwulink') {
            newDetails = {
              ...details,
              typeInfo: {
                ...details.typeInfo,
                externalDappInfo: {
                  ...(details.typeInfo.externalDappInfo ?? {}),
                  requestType: DappRequestType.UwULink,
                },
              },
            }
          }

          if (details.typeInfo?.externalDappInfo?.source === 'walletconnect') {
            newDetails = {
              ...details,
              typeInfo: {
                ...details.typeInfo,
                externalDappInfo: {
                  ...(details.typeInfo.externalDappInfo ?? {}),
                  requestType: DappRequestType.WalletConnectSessionRequest,
                },
              },
            }
          }

          if (details.typeInfo?.type === TransactionType.WCConfirm && details.typeInfo?.dapp) {
            newDetails.typeInfo.dappRequestInfo = {
              ...(details.typeInfo.dapp ?? {}),
            }
          }

          delete newDetails.typeInfo?.dapp
          delete newDetails.typeInfo?.externalDappInfo?.source

          newTransactionState[address] ??= {}
          newTransactionState[address][chainId] ??= {}
          newTransactionState[address][chainId][txId] = newDetails
        }
      }
    }

    return {
      ...newState,
      transactions: newTransactionState,
    }
  },
  onError: (state: any) => ({ ...state, transactions: {} }),
})

export const migrateAndRemoveCloudBackupSlice = createSafeMigration({
  name: 'migrateAndRemoveCloudBackupSlice',
  migrate: (state: any) => {
    const newState = { ...state }
    const backupEmail = newState.cloudBackup?.backupsFound?.find((backup: any) => backup.email)?.email
    if (backupEmail) {
      newState.wallet = {
        ...newState.wallet,
        androidCloudBackupEmail: backupEmail,
      }
    }
    delete newState.cloudBackup

    return newState
  },
  onError: (state: any) => {
    const fallbackState = { ...state }
    delete fallbackState.cloudBackup
    return fallbackState
  },
})
