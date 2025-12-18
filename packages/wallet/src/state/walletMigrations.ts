/* eslint-disable @typescript-eslint/no-unsafe-return */
/* biome-ignore-all lint/suspicious/noExplicitAny: Migration types require dynamic typing */

import { RankingType } from '@universe/api'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { BasicTokenInfo, SerializedTokenMap, TokenDismissInfo } from 'uniswap/src/features/tokens/warnings/slice/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { Account } from 'wallet/src/features/wallet/accounts/types'

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
// 1. if there's a view only pending account, always activate it
// 2. if there's a signer pending account and it
//     a. has the same mnemonic id as the active account, always activate it unless:
//         1. if there's more than 6, only activate the oldest/newest 3. delete the rest
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

// Mobile: 68
// Extension: 5
export function deleteBetaOnboardingState(state: any): any {
  const newState = { ...state }
  delete newState?.behaviorHistory?.extensionBetaFeedbackState
  return newState
}

export function deleteExtensionOnboardingState(state: any): any {
  const newState = { ...state }
  delete newState?.behaviorHistory?.extensionOnboardingState
  return newState
}

// default watched wallets that were removed as defaults
const VITALIK_ETH_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
export const HAYDEN_ETH_ADDRESS = '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3'

// Mobile: 70
// Extension: 7
export function deleteDefaultFavoritesFromFavoritesState(state: any): any {
  const newState = { ...state }

  const filteredWatchedAddresses = newState.favorites?.watchedAddresses?.filter(
    (address: string) =>
      !areAddressesEqual({
        addressInput1: { address, platform: Platform.EVM },
        addressInput2: { address: VITALIK_ETH_ADDRESS, platform: Platform.EVM },
      }) &&
      !areAddressesEqual({
        addressInput1: { address, platform: Platform.EVM },
        addressInput2: { address: HAYDEN_ETH_ADDRESS, platform: Platform.EVM },
      }),
  )

  return {
    ...newState,
    favorites: {
      ...newState.favorites,
      watchedAddresses: filteredWatchedAddresses,
    },
  }
}

// Mobile: 71
// Extension: 8
export function addHapticSetting(state: any): any {
  const newState = { ...state }

  newState.appearanceSettings = {
    ...newState.appearanceSettings,
    hapticsEnabled: true,
  }

  return newState
}

// Mobile: 72
// Extension: 9
export function addExploreAndWelcomeBehaviorHistory(state: any): any {
  return {
    ...state,
    behaviorHistory: { ...state.behaviorHistory, hasViewedWelcomeWalletCard: false, hasUsedExplore: false },
  }
}

// Mobile: 73
// Extension: 10
export function moveUserSettings(state: any): any {
  const newState = {
    ...state,
    userSettings: {
      hideSmallBalances: state.wallet?.settings?.hideSmallBalances === false ? false : true,
      hideSpamTokens: state.wallet?.settings?.hideSpamTokens === false ? false : true,
    },
  }

  // Delete migrated settings
  delete newState.wallet?.settings?.hideSmallBalances
  delete newState.wallet?.settings?.hideSpamTokens

  // Delete unused settings
  delete newState.wallet?.settings?.nftViewType
  return newState
}

// Mobile: 75
// Extension: 11
export function deleteHoldToSwapBehaviorHistory(state: any): any {
  const newState = { ...state }
  delete newState.behaviorHistory?.hasViewedReviewScreen
  delete newState.behaviorHistory?.hasSubmittedHoldToSwap
  return newState
}

// Mobile: 76
// Extension: 12
export function addCreatedOnboardingRedesignAccountBehaviorHistory(state: any): any {
  const newState = {
    ...state,
    behaviorHistory: {
      ...state.behaviorHistory,
      createdOnboardingRedesignAccount: false,
    },
  }
  return newState
}

export function moveDismissedTokenWarnings(state: any): any {
  // Don't migrate if the state doesn't exist
  if (typeof state.tokens?.dismissedWarningTokens !== 'object') {
    return state
  }

  // Translate old warning
  const newWarnings: SerializedTokenMap<TokenDismissInfo> = {}
  Object.keys(state.tokens.dismissedWarningTokens).forEach((currencyId: CurrencyId) => {
    const chainId = currencyIdToChain(currencyId)
    const address = currencyIdToAddress(currencyId)
    if (chainId) {
      const serializedToken: BasicTokenInfo = {
        chainId,
        address,
      }
      newWarnings[chainId] = newWarnings[chainId] || {}
      // biome-ignore lint/style/noNonNullAssertion: Safe assertion in migration context - we just created this key
      newWarnings[chainId]![address] = serializedToken
    }
  })

  // Replace old warnings with new warnings
  const newState = {
    ...state,
    tokens: {
      dismissedTokenWarnings: newWarnings,
    },
  }

  return newState
}

export function moveLanguageSetting(state: any): any {
  const newState = {
    ...state,
    languageSettings: undefined,
    userSettings: {
      ...state.userSettings,
      currentLanguage: state.languageSettings?.currentLanguage ?? Language.English,
    },
  }

  delete newState.languageSettings

  return newState
}

export function moveCurrencySetting(state: any): any {
  const newState = {
    ...state,
    fiatCurrencySettings: undefined,
    userSettings: {
      ...state.userSettings,
      currentCurrency: state.fiatCurrencySettings?.currentCurrency ?? FiatCurrency.UnitedStatesDollar,
    },
  }

  delete newState.fiatCurrencySettings

  return newState
}

export function updateExploreOrderByType(state: any): any {
  const newState = { ...state }

  return {
    ...newState,
    wallet: {
      ...newState.wallet,
      settings: {
        ...newState.wallet?.settings,
        tokensOrderBy: RankingType.Volume,
      },
    },
  }
}

// Mobile: 81
// Extension: 17
export function removeCreatedOnboardingRedesignAccountBehaviorHistory(state: any): any {
  const newState = {
    ...state,
    behaviorHistory: {
      ...state.behaviorHistory,
      createdOnboardingRedesignAccount: undefined,
    },
  }

  delete newState.behaviorHistory.createdOnboardingRedesignAccount
  return newState
}

// Mobile: 84
// Extension: 18
export function deleteWelcomeWalletCardBehaviorHistory(state: any): any {
  const newState = { ...state }
  delete newState.behaviorHistory?.hasViewedWelcomeWalletCard
  return newState
}

// Mobile: 85
// Extension: 19
export function moveTokenAndNFTVisibility(state: any): any {
  const newState = {
    ...state,
    visibility: {
      ...state.visibility,
      positions: {},
      tokens: state.favorites.tokensVisibility,
      nfts: state.favorites.nftsVisibility,
    },
    favorites: {
      ...state.favorites,
      tokensVisibility: undefined,
      nftsVisibility: undefined,
    },
  }
  delete newState.favorites.tokensVisibility
  delete newState.favorites.nftsVisibility
  return newState
}

// Mobile: 86
// Extension: 22
export function addBatchedTransactions(state: any): any {
  const newState = {
    ...state,
    batchedTransactions: {},
  }
  return newState
}

// Mobile: 88
// Extension: 24
export function moveHapticsToUserSettings(state: any): any {
  const newState = {
    ...state,
    appearanceSettings: {
      ...state.appearanceSettings,
      hapticsEnabled: undefined,
    },
    userSettings: {
      ...state.userSettings,
      hapticsEnabled: state.appearanceSettings.hapticsEnabled ?? true,
    },
  }
  delete newState.appearanceSettings.hapticsEnabled
  return newState
}

// Mobile: 90
// Extension: 26
export function migrateLiquidityTransactionInfo(state: any): any {
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

        newTransactionState[address] ??= {}
        newTransactionState[address][chainId] ??= {}

        const isLiquidityTransactionBeingRenamed = [
          TransactionType.LiquidityIncrease,
          TransactionType.LiquidityDecrease,
          TransactionType.CollectFees,
          TransactionType.CreatePool,
          TransactionType.CreatePair,
        ].includes(txDetails?.typeInfo?.type)
        // ignore if it's not a liquidity transaction
        if (!isLiquidityTransactionBeingRenamed) {
          newTransactionState[address][chainId][txId] = txDetails
        } else {
          // eslint-disable-next-line max-depth
          try {
            const { typeInfo, ...txRest } = txDetails
            const {
              inputCurrencyId,
              inputCurrencyAmountRaw,
              outputCurrencyId,
              outputCurrencyAmountRaw,
              ...typeInfoRest
            } = typeInfo
            newTransactionState[address][chainId][txId] = {
              ...txRest,
              typeInfo: {
                currency0Id: inputCurrencyId,
                currency0AmountRaw: inputCurrencyAmountRaw,
                currency1Id: outputCurrencyId,
                currency1AmountRaw: outputCurrencyAmountRaw,
                ...typeInfoRest,
              },
            }
          } catch (_e) {
            // if any error occurs, ignore but remove the transaction
          }
        }
      }
    }
  }
  return { ...state, transactions: newTransactionState }
}

// Mobile: 91
export function removePriceAlertsEnabledFromPushNotifications(state: any): any {
  const newState = { ...state }
  delete newState.pushNotifications.priceAlertsEnabled
  return newState
}
