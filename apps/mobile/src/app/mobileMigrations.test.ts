/**
 * Isolated tests for individual migration functions.
 *
 * Tests each migration independently with various input states, edge cases,
 * and error handling, without relying on output from previous migrations.
 *
 * For tests of the full migration chain, see mobileMigrationTests.ts.
 */
import {
  addAllowAnalyticsSwitch,
  addAppearanceSetting,
  addBehaviorHistory,
  addBiometricSettings,
  addCloudBackup,
  addCompletedUnitagsIntroBoolean,
  addEnsState,
  addExperimentsSlice,
  addExtensionOnboardingState,
  addFiatCurrencySettings,
  addHiddenNfts,
  addLanguageSettings,
  addLastBalancesReport,
  addLastBalancesReportValue,
  addModalsState,
  addPasswordLockout,
  addPushNotifications,
  addPushNotificationsEnabledToAccounts,
  addReplaceAccountOptions,
  addSearchHistory,
  addSkippedUnitagBoolean,
  addSwapProtectionSetting,
  addTimeImportedAndDerivationIndex,
  addTokensVisibility,
  addTweaksStartingState,
  addUniconV2IntroModalBoolean,
  addWalletConnectPendingSessionAndSettings,
  addWalletIsFunded,
  changeNativeTypeToSignerMnemonic,
  convertHiddenNftsToNftsData,
  correctFailedFiatOnRampTxIds,
  deleteChainsSlice,
  deleteOldOnRampTxData,
  deleteRTKQuerySlices,
  emptyMigration,
  filterToSupportedChains,
  flattenTokenVisibility,
  migrateAndRemoveCloudBackupSlice,
  migrateBiometricSettings,
  migrateDappRequestInfoTypes,
  migrateFiatPurchaseTransactionInfo,
  moveSettingStateToGlobal,
  OLD_DEMO_ACCOUNT_ADDRESS,
  removeCoingeckoApiAndTokenLists,
  removeDataApi,
  removeDemoAccount,
  removeEnsState,
  removeExperimentsSlice,
  removeFlashbotsEnabledFromWalletSlice,
  removeLocalTypeAccounts,
  removeNonZeroDerivationIndexAccounts,
  removePersistedWalletConnectSlice,
  removeProviders,
  removeReplaceAccountOptions,
  removeShowSmallBalances,
  removeTokenListsAndCustomTokens,
  removeTokensMetadataDisplayType,
  removeWalletConnectModalState,
  renameFollowedAddressesToWatchedAddresses,
  resetActiveChains,
  resetEnsApi,
  resetLastTxNotificationUpdate,
  resetOnboardingStateForGA,
  resetPushNotificationsEnabled,
  resetTokensOrderBy,
  resetTokensOrderByAndMetadataDisplayType,
  restructureTransactionsAndNotifications,
  transformNotificationCountToStatus,
  updateLanguageSettings,
} from 'src/app/mobileMigrations'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { DappRequestType } from 'uniswap/src/types/walletConnect'
import { createThrowingProxy } from 'utilities/src/test/utils'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

describe('restructureTransactionsAndNotifications', () => {
  it('restructures transactions from byChainId to address-based format', () => {
    const state = {
      transactions: {
        byChainId: {
          '1': {
            tx1: { id: 'tx1', from: '0x123', chainId: 1 },
          },
        },
        lastTxHistoryUpdate: {
          '0x123': 1234567890,
        },
      },
      notifications: {},
    }
    const result = restructureTransactionsAndNotifications(state)
    expect(result.transactions['0x123']['1'].tx1).toEqual({ id: 'tx1', from: '0x123', chainId: 1 })
    expect(result.notifications.lastTxNotificationUpdate['0x123'][UniverseChainId.Mainnet]).toBe(1234567890)
  })

  it('handles missing transaction state', () => {
    const state = { notifications: {} }
    const result = restructureTransactionsAndNotifications(state)
    expect(result.transactions).toEqual({})
  })

  it('falls back to empty state on error', () => {
    const state = {
      transactions: createThrowingProxy({}, { throwingMethods: ['*'] }),
      notifications: {},
    }
    const result = restructureTransactionsAndNotifications(state)
    expect(result.transactions).toEqual({})
    expect(result.notifications.lastTxNotificationUpdate).toEqual({})
  })
})

describe('removeWalletConnectModalState', () => {
  it('removes modalState from walletConnect', () => {
    const state = { walletConnect: { modalState: 'open', otherData: 'preserved' } }
    const result = removeWalletConnectModalState(state)
    expect(result.walletConnect.modalState).toBeUndefined()
    expect(result.walletConnect.otherData).toBe('preserved')
  })

  it('handles missing walletConnect state', () => {
    const state = { otherData: 'preserved' }
    const result = removeWalletConnectModalState(state)
    expect(result.otherData).toBe('preserved')
  })
})

describe('renameFollowedAddressesToWatchedAddresses', () => {
  it('renames followedAddresses to watchedAddresses', () => {
    const state = { favorites: { followedAddresses: ['0x123'] } }
    const result = renameFollowedAddressesToWatchedAddresses(state)
    expect(result.favorites.watchedAddresses).toEqual(['0x123'])
    expect(result.favorites.followedAddresses).toBeUndefined()
  })

  it('handles missing favorites state', () => {
    const state = { otherData: 'preserved' }
    const result = renameFollowedAddressesToWatchedAddresses(state)
    expect(result.otherData).toBe('preserved')
  })
})

describe('addSearchHistory', () => {
  it('adds searchHistory with empty results', () => {
    const state = { otherData: 'preserved' }
    const result = addSearchHistory(state)
    expect(result.searchHistory).toEqual({ results: [] })
    expect(result.otherData).toBe('preserved')
  })
})

describe('addTimeImportedAndDerivationIndex', () => {
  it('adds timeImportedMs to all accounts and derivationIndex to native accounts', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { type: 'native', address: '0x123' },
          '0x456': { type: 'readonly', address: '0x456' },
        },
      },
    }
    const result = addTimeImportedAndDerivationIndex(state)
    expect(result.wallet.accounts['0x123'].timeImportedMs).toBeDefined()
    expect(result.wallet.accounts['0x123'].derivationIndex).toBe(0)
    expect(result.wallet.accounts['0x456'].timeImportedMs).toBeDefined()
    expect(result.wallet.accounts['0x456'].derivationIndex).toBeUndefined()
  })

  it('handles missing accounts', () => {
    const state = { wallet: {} }
    const result = addTimeImportedAndDerivationIndex(state)
    expect(result.wallet).toBeDefined()
  })
})

describe('addModalsState', () => {
  it('adds modals state and removes balances', () => {
    const state = { balances: { someData: true } }
    const result = addModalsState(state)
    expect(result.modals[ModalName.WalletConnectScan]).toEqual({ isOpen: false, initialState: 0 })
    expect(result.modals[ModalName.Swap]).toEqual({ isOpen: false, initialState: undefined })
    expect(result.modals[ModalName.Send]).toEqual({ isOpen: false, initialState: undefined })
    expect(result.balances).toBeUndefined()
  })
})

describe('addWalletConnectPendingSessionAndSettings', () => {
  it('adds pendingSession and settings', () => {
    const state = { walletConnect: {}, wallet: { bluetooth: true } }
    const result = addWalletConnectPendingSessionAndSettings(state)
    expect(result.walletConnect.pendingSession).toBeNull()
    expect(result.wallet.settings).toEqual({})
    expect(result.wallet.bluetooth).toBeUndefined()
  })
})

describe('removeNonZeroDerivationIndexAccounts', () => {
  it('removes accounts with non-zero derivation index and sets mnemonicId', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { type: 'native', derivationIndex: 0, address: '0x123' },
          '0x456': { type: 'native', derivationIndex: 1, address: '0x456' },
        },
      },
    }
    const result = removeNonZeroDerivationIndexAccounts(state)
    expect(result.wallet.accounts['0x123'].mnemonicId).toBe('0x123')
    expect(result.wallet.accounts['0x456']).toBeUndefined()
  })
})

describe('addCloudBackup', () => {
  it('adds cloudBackup with empty backupsFound', () => {
    const state = { otherData: 'preserved' }
    const result = addCloudBackup(state)
    expect(result.cloudBackup).toEqual({ backupsFound: [] })
  })
})

describe('removeLocalTypeAccounts', () => {
  it('removes accounts with local type', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { type: 'local' },
          '0x456': { type: 'native' },
        },
      },
    }
    const result = removeLocalTypeAccounts(state)
    expect(result.wallet.accounts['0x123']).toBeUndefined()
    expect(result.wallet.accounts['0x456']).toBeDefined()
  })
})

describe('removeDemoAccount', () => {
  it('removes the demo account', () => {
    const state = {
      wallet: {
        accounts: {
          [OLD_DEMO_ACCOUNT_ADDRESS]: { type: 'demo' },
          '0x456': { type: 'native' },
        },
      },
    }
    const result = removeDemoAccount(state)
    expect(result.wallet.accounts[OLD_DEMO_ACCOUNT_ADDRESS]).toBeUndefined()
    expect(result.wallet.accounts['0x456']).toBeDefined()
  })

  it('handles missing demo account', () => {
    const state = { wallet: { accounts: { '0x123': { type: 'native' } } } }
    const result = removeDemoAccount(state)
    expect(result.wallet.accounts['0x123']).toBeDefined()
  })
})

describe('addBiometricSettings', () => {
  it('adds biometricSettings with defaults', () => {
    const state = { otherData: 'preserved' }
    const result = addBiometricSettings(state)
    expect(result.biometricSettings).toEqual({
      requiredForAppAccess: false,
      requiredForTransactions: false,
    })
  })
})

describe('addPushNotificationsEnabledToAccounts', () => {
  it('adds pushNotificationsEnabled to all accounts', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { address: '0x123' },
          '0x456': { address: '0x456' },
        },
      },
    }
    const result = addPushNotificationsEnabledToAccounts(state)
    expect(result.wallet.accounts['0x123'].pushNotificationsEnabled).toBe(false)
    expect(result.wallet.accounts['0x456'].pushNotificationsEnabled).toBe(false)
  })

  it('handles missing accounts', () => {
    const state = { wallet: {} }
    const result = addPushNotificationsEnabledToAccounts(state)
    expect(result.wallet.accounts).toEqual({})
  })
})

describe('addEnsState', () => {
  it('adds ens state with empty ensForAddress', () => {
    const state = { otherData: 'preserved' }
    const result = addEnsState(state)
    expect(result.ens).toEqual({ ensForAddress: {} })
  })
})

describe('migrateBiometricSettings', () => {
  it('migrates isBiometricAuthEnabled to biometricSettings', () => {
    const state = { wallet: { isBiometricAuthEnabled: true } }
    const result = migrateBiometricSettings(state)
    expect(result.biometricSettings).toEqual({
      requiredForAppAccess: true,
      requiredForTransactions: true,
    })
    expect(result.wallet.isBiometricAuthEnabled).toBeUndefined()
  })

  it('defaults to false when isBiometricAuthEnabled is missing', () => {
    const state = { wallet: {} }
    const result = migrateBiometricSettings(state)
    expect(result.biometricSettings).toEqual({
      requiredForAppAccess: false,
      requiredForTransactions: false,
    })
  })

  it('falls back to default settings on error', () => {
    const state = { wallet: createThrowingProxy({}, { throwingMethods: ['*'] }) }
    const result = migrateBiometricSettings(state)
    expect(result.biometricSettings).toEqual({
      requiredForAppAccess: false,
      requiredForTransactions: false,
    })
  })
})

describe('changeNativeTypeToSignerMnemonic', () => {
  it('changes native type to SignerMnemonic', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { type: 'native' },
          '0x456': { type: 'readonly' },
        },
      },
    }
    const result = changeNativeTypeToSignerMnemonic(state)
    expect(result.wallet.accounts['0x123'].type).toBe(AccountType.SignerMnemonic)
    expect(result.wallet.accounts['0x456'].type).toBe('readonly')
  })
})

describe('removeDataApi', () => {
  it('removes dataApi from state', () => {
    const state = { dataApi: { someData: true }, otherData: 'preserved' }
    const result = removeDataApi(state)
    expect(result.dataApi).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })
})

describe('resetPushNotificationsEnabled', () => {
  it('resets pushNotificationsEnabled to false for all accounts', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { pushNotificationsEnabled: true },
          '0x456': { pushNotificationsEnabled: true },
        },
      },
    }
    const result = resetPushNotificationsEnabled(state)
    expect(result.wallet.accounts['0x123'].pushNotificationsEnabled).toBe(false)
    expect(result.wallet.accounts['0x456'].pushNotificationsEnabled).toBe(false)
  })

  it('returns state unchanged if no accounts', () => {
    const state = { wallet: {} }
    const result = resetPushNotificationsEnabled(state)
    expect(result).toEqual(state)
  })
})

describe('removeEnsState', () => {
  it('removes ens from state', () => {
    const state = { ens: { someData: true }, otherData: 'preserved' }
    const result = removeEnsState(state)
    expect(result.ens).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })
})

describe('filterToSupportedChains', () => {
  it('filters chains, blocks, and transactions to supported chains only', () => {
    const state = {
      chains: {
        byChainId: {
          '1': { isActive: true },
          '99999': { isActive: true }, // unsupported
        },
      },
      blocks: {
        byChainId: {
          '1': { blockNumber: 123 },
          '99999': { blockNumber: 456 },
        },
      },
      transactions: {
        '0x123': {
          '1': { tx1: { id: 'tx1' } },
          '99999': { tx2: { id: 'tx2' } },
        },
      },
    }
    const result = filterToSupportedChains(state)
    expect(result.chains.byChainId['1']).toBeDefined()
    expect(result.chains.byChainId['99999']).toBeUndefined()
    expect(result.blocks.byChainId['1']).toBeDefined()
    expect(result.blocks.byChainId['99999']).toBeUndefined()
    expect(result.transactions['0x123']['1']).toBeDefined()
    expect(result.transactions['0x123']['99999']).toBeUndefined()
  })
})

describe('resetLastTxNotificationUpdate', () => {
  it('resets lastTxNotificationUpdate to empty object', () => {
    const state = { notifications: { lastTxNotificationUpdate: { '0x123': 12345 } } }
    const result = resetLastTxNotificationUpdate(state)
    expect(result.notifications.lastTxNotificationUpdate).toEqual({})
  })
})

describe('addExperimentsSlice', () => {
  it('adds experiments slice with empty experiments and featureFlags', () => {
    const state = { otherData: 'preserved' }
    const result = addExperimentsSlice(state)
    expect(result.experiments).toEqual({ experiments: {}, featureFlags: {} })
  })
})

describe('removeCoingeckoApiAndTokenLists', () => {
  it('removes coingeckoApi and token-related data', () => {
    const state = {
      coingeckoApi: { data: true },
      tokens: { watchedTokens: [], tokenPairs: [], otherData: true },
    }
    const result = removeCoingeckoApiAndTokenLists(state)
    expect(result.coingeckoApi).toBeUndefined()
    expect(result.tokens.watchedTokens).toBeUndefined()
    expect(result.tokens.tokenPairs).toBeUndefined()
    expect(result.tokens.otherData).toBe(true)
  })
})

describe('resetTokensOrderByAndMetadataDisplayType', () => {
  it('removes tokensOrderBy and tokensMetadataDisplayType from wallet settings', () => {
    const state = {
      wallet: {
        settings: { tokensOrderBy: 'volume', tokensMetadataDisplayType: 'full', otherSetting: true },
      },
    }
    const result = resetTokensOrderByAndMetadataDisplayType(state)
    expect(result.wallet.settings.tokensOrderBy).toBeUndefined()
    expect(result.wallet.settings.tokensMetadataDisplayType).toBeUndefined()
    expect(result.wallet.settings.otherSetting).toBe(true)
  })
})

describe('transformNotificationCountToStatus', () => {
  it('transforms notificationCount to notificationStatus', () => {
    const state = {
      notifications: {
        notificationCount: { '0x123': 5, '0x456': 0 },
      },
    }
    const result = transformNotificationCountToStatus(state)
    expect(result.notifications.notificationStatus['0x123']).toBe(true)
    expect(result.notifications.notificationStatus['0x456']).toBe(false)
    expect(result.notifications.notificationCount).toBeUndefined()
  })

  it('falls back to empty notificationStatus on error', () => {
    const state = {
      notifications: { notificationCount: createThrowingProxy({}, { throwingMethods: ['*'] }) },
    }
    const result = transformNotificationCountToStatus(state)
    expect(result.notifications.notificationStatus).toEqual({})
  })
})

describe('addPasswordLockout', () => {
  it('adds passwordLockout with zero attempts', () => {
    const state = { otherData: 'preserved' }
    const result = addPasswordLockout(state)
    expect(result.passwordLockout).toEqual({ passwordAttempts: 0 })
  })
})

describe('removeShowSmallBalances', () => {
  it('removes showSmallBalances from wallet settings', () => {
    const state = { wallet: { settings: { showSmallBalances: true, otherSetting: true } } }
    const result = removeShowSmallBalances(state)
    expect(result.wallet.settings.showSmallBalances).toBeUndefined()
    expect(result.wallet.settings.otherSetting).toBe(true)
  })
})

describe('resetTokensOrderBy', () => {
  it('removes tokensOrderBy from wallet settings', () => {
    const state = { wallet: { settings: { tokensOrderBy: 'volume' } } }
    const result = resetTokensOrderBy(state)
    expect(result.wallet.settings.tokensOrderBy).toBeUndefined()
  })
})

describe('removeTokensMetadataDisplayType', () => {
  it('removes tokensMetadataDisplayType from wallet settings', () => {
    const state = { wallet: { settings: { tokensMetadataDisplayType: 'full' } } }
    const result = removeTokensMetadataDisplayType(state)
    expect(result.wallet.settings.tokensMetadataDisplayType).toBeUndefined()
  })
})

describe('removeTokenListsAndCustomTokens', () => {
  it('removes tokenLists and customTokens', () => {
    const state = { tokenLists: { lists: [] }, tokens: { customTokens: [], otherData: true } }
    const result = removeTokenListsAndCustomTokens(state)
    expect(result.tokenLists).toBeUndefined()
    expect(result.tokens.customTokens).toBeUndefined()
    expect(result.tokens.otherData).toBe(true)
  })
})

describe('migrateFiatPurchaseTransactionInfo', () => {
  it('migrates fiat purchase transaction info format', () => {
    const state = {
      transactions: {
        '0x123': {
          '1': {
            tx1: {
              id: 'tx1',
              status: TransactionStatus.Success,
              typeInfo: {
                type: TransactionType.FiatPurchaseDeprecated,
                explorerUrl: 'https://example.com',
                outputTokenAddress: '0xtoken',
                outputCurrencyAmountFormatted: 100,
                outputCurrencyAmountPrice: 2,
                syncedWithBackend: true,
              },
            },
          },
        },
      },
    }
    const result = migrateFiatPurchaseTransactionInfo(state)
    const txTypeInfo = result.transactions['0x123']['1'].tx1.typeInfo
    expect(txTypeInfo.inputCurrency).toBeUndefined()
    expect(txTypeInfo.outputCurrency.type).toBe('crypto')
  })

  it('removes failed fiat purchase transactions', () => {
    const state = {
      transactions: {
        '0x123': {
          '1': {
            tx1: {
              id: 'tx1',
              status: TransactionStatus.Failed,
              typeInfo: { type: TransactionType.FiatPurchaseDeprecated },
            },
          },
        },
      },
    }
    const result = migrateFiatPurchaseTransactionInfo(state)
    // Failed FiatPurchaseDeprecated transactions are skipped entirely
    expect(result.transactions['0x123']?.['1']?.tx1).toBeUndefined()
  })

  it('falls back to empty transactions on error', () => {
    const state = {
      transactions: createThrowingProxy({}, { throwingMethods: ['*'] }),
      otherData: 'preserved',
    }
    const result = migrateFiatPurchaseTransactionInfo(state)
    expect(result.transactions).toEqual({})
    expect(result.otherData).toBe('preserved')
  })
})

describe('emptyMigration', () => {
  it('returns state unchanged', () => {
    const state = { someData: 'preserved' }
    const result = emptyMigration(state)
    expect(result).toEqual(state)
  })
})

describe('resetEnsApi', () => {
  it('removes ENS from state', () => {
    const state = { ENS: { data: true }, otherData: 'preserved' }
    const result = resetEnsApi(state)
    expect(result.ENS).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })
})

describe('addReplaceAccountOptions', () => {
  it('adds replaceAccountOptions to wallet', () => {
    const state = { wallet: {} }
    const result = addReplaceAccountOptions(state)
    expect(result.wallet.replaceAccountOptions).toEqual({
      isReplacingAccount: false,
      skipToSeedPhrase: false,
    })
  })
})

describe('addLastBalancesReport', () => {
  it('adds telemetry with lastBalancesReport', () => {
    const state = { otherData: 'preserved' }
    const result = addLastBalancesReport(state)
    expect(result.telemetry).toEqual({ lastBalancesReport: 0 })
  })
})

describe('addAppearanceSetting', () => {
  it('adds appearanceSettings with system default', () => {
    const state = { otherData: 'preserved' }
    const result = addAppearanceSetting(state)
    expect(result.appearanceSettings).toEqual({ selectedAppearanceSettings: 'system' })
  })
})

describe('addHiddenNfts', () => {
  it('adds hiddenNfts to favorites', () => {
    const state = { favorites: { tokens: [] } }
    const result = addHiddenNfts(state)
    expect(result.favorites.hiddenNfts).toEqual({})
    expect(result.favorites.tokens).toEqual([])
  })
})

describe('correctFailedFiatOnRampTxIds', () => {
  it('extracts id from explorerUrl for failed fiat purchase transactions', () => {
    const state = {
      transactions: {
        '0x123': {
          '1': {
            tx1: {
              id: 'tx1',
              status: TransactionStatus.Failed,
              typeInfo: {
                type: TransactionType.FiatPurchaseDeprecated,
                explorerUrl: 'https://example.com?id=extractedId123',
              },
            },
          },
        },
      },
    }
    const result = correctFailedFiatOnRampTxIds(state)
    expect(result.transactions['0x123']['1'].tx1.typeInfo.id).toBe('extractedId123')
  })

  it('falls back to empty transactions on error', () => {
    const state = {
      transactions: createThrowingProxy({}, { throwingMethods: ['*'] }),
    }
    const result = correctFailedFiatOnRampTxIds(state)
    expect(result.transactions).toEqual({})
  })
})

describe('removeReplaceAccountOptions', () => {
  it('removes replaceAccountOptions from wallet', () => {
    const state = { wallet: { replaceAccountOptions: { isReplacingAccount: false }, otherData: true } }
    const result = removeReplaceAccountOptions(state)
    expect(result.wallet.replaceAccountOptions).toBeUndefined()
    expect(result.wallet.otherData).toBe(true)
  })
})

describe('removeExperimentsSlice', () => {
  it('removes experiments from state', () => {
    const state = { experiments: { data: true }, otherData: 'preserved' }
    const result = removeExperimentsSlice(state)
    expect(result.experiments).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })
})

describe('removePersistedWalletConnectSlice', () => {
  it('removes walletConnect from state', () => {
    const state = { walletConnect: { data: true }, otherData: 'preserved' }
    const result = removePersistedWalletConnectSlice(state)
    expect(result.walletConnect).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })
})

describe('addLastBalancesReportValue', () => {
  it('adds lastBalancesReportValue to telemetry', () => {
    const state = { telemetry: { lastBalancesReport: 0 } }
    const result = addLastBalancesReportValue(state)
    expect(result.telemetry.lastBalancesReportValue).toBe(0)
    expect(result.telemetry.lastBalancesReport).toBe(0)
  })
})

describe('removeFlashbotsEnabledFromWalletSlice', () => {
  it('removes flashbotsEnabled from wallet', () => {
    const state = { wallet: { flashbotsEnabled: true, otherData: true } }
    const result = removeFlashbotsEnabledFromWalletSlice(state)
    expect(result.wallet.flashbotsEnabled).toBeUndefined()
    expect(result.wallet.otherData).toBe(true)
  })
})

describe('convertHiddenNftsToNftsData', () => {
  it('converts hiddenNfts to nftsData format', () => {
    const state = {
      favorites: {
        hiddenNfts: {
          '0x123': {
            'mainnet.0xcontract.123': true,
          },
        },
      },
    }
    const result = convertHiddenNftsToNftsData(state)
    expect(result.favorites.nftsData['0x123']).toBeDefined()
    expect(result.favorites.hiddenNfts).toBeUndefined()
  })

  it('falls back to empty nftsData on error', () => {
    const state = {
      favorites: { hiddenNfts: createThrowingProxy({}, { throwingMethods: ['*'] }) },
    }
    const result = convertHiddenNftsToNftsData(state)
    expect(result.favorites.nftsData).toEqual({})
  })
})

describe('removeProviders', () => {
  it('removes providers from state', () => {
    const state = { providers: { data: true }, otherData: 'preserved' }
    const result = removeProviders(state)
    expect(result.providers).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })
})

describe('addTokensVisibility', () => {
  it('adds tokensVisibility to favorites', () => {
    const state = { favorites: { tokens: [] } }
    const result = addTokensVisibility(state)
    expect(result.favorites.tokensVisibility).toEqual({})
  })
})

describe('deleteRTKQuerySlices', () => {
  it('removes RTK Query slices', () => {
    const state = {
      ENS: {},
      ens: {},
      gasApi: {},
      onChainBalanceApi: {},
      routingApi: {},
      trmApi: {},
      otherData: 'preserved',
    }
    const result = deleteRTKQuerySlices(state)
    expect(result.ENS).toBeUndefined()
    expect(result.ens).toBeUndefined()
    expect(result.gasApi).toBeUndefined()
    expect(result.onChainBalanceApi).toBeUndefined()
    expect(result.routingApi).toBeUndefined()
    expect(result.trmApi).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })
})

describe('resetActiveChains', () => {
  it('resets byChainId to default active chains', () => {
    const state = { chains: { byChainId: { '1': { isActive: false } } } }
    const result = resetActiveChains(state)
    expect(result.chains.byChainId['1']).toEqual({ isActive: true })
    expect(result.chains.byChainId['10']).toEqual({ isActive: true })
    expect(result.chains.byChainId['56']).toEqual({ isActive: true })
    expect(result.chains.byChainId['137']).toEqual({ isActive: true })
    expect(result.chains.byChainId['8453']).toEqual({ isActive: true })
    expect(result.chains.byChainId['42161']).toEqual({ isActive: true })
  })
})

describe('addTweaksStartingState', () => {
  it('adds empty tweaks object', () => {
    const state = { otherData: 'preserved' }
    const result = addTweaksStartingState(state)
    expect(result.tweaks).toEqual({})
  })
})

describe('addSwapProtectionSetting', () => {
  it('adds swapProtection setting to wallet settings', () => {
    const state = { wallet: { settings: {} } }
    const result = addSwapProtectionSetting(state)
    expect(result.wallet.settings.swapProtection).toBe(SwapProtectionSetting.On)
  })
})

describe('deleteChainsSlice', () => {
  it('removes chains from state', () => {
    const state = { chains: { byChainId: {} }, otherData: 'preserved' }
    const result = deleteChainsSlice(state)
    expect(result.chains).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })
})

describe('addLanguageSettings', () => {
  it('adds languageSettings with English default', () => {
    const state = { otherData: 'preserved' }
    const result = addLanguageSettings(state)
    expect(result.languageSettings).toEqual({ currentLanguage: Language.English })
  })
})

describe('addFiatCurrencySettings', () => {
  it('adds fiatCurrencySettings with USD default', () => {
    const state = { otherData: 'preserved' }
    const result = addFiatCurrencySettings(state)
    expect(result.fiatCurrencySettings).toEqual({ currentCurrency: FiatCurrency.UnitedStatesDollar })
  })
})

describe('updateLanguageSettings', () => {
  it('sets languageSettings to English', () => {
    const state = { languageSettings: { currentLanguage: 'es' } }
    const result = updateLanguageSettings(state)
    expect(result.languageSettings).toEqual({ currentLanguage: Language.English })
  })
})

describe('addWalletIsFunded', () => {
  it('adds walletIsFunded to telemetry', () => {
    const state = { telemetry: { lastBalancesReport: 0 } }
    const result = addWalletIsFunded(state)
    expect(result.telemetry.walletIsFunded).toBe(false)
    expect(result.telemetry.lastBalancesReport).toBe(0)
  })
})

describe('addBehaviorHistory', () => {
  it('adds behaviorHistory with default values', () => {
    const state = { otherData: 'preserved' }
    const result = addBehaviorHistory(state)
    expect(result.behaviorHistory).toEqual({
      hasViewedReviewScreen: false,
      hasSubmittedHoldToSwap: false,
    })
  })
})

describe('addAllowAnalyticsSwitch', () => {
  it('adds analytics settings to telemetry', () => {
    const state = { telemetry: { walletIsFunded: false } }
    const result = addAllowAnalyticsSwitch(state)
    expect(result.telemetry.allowAnalytics).toBe(true)
    expect(result.telemetry.lastHeartbeat).toBe(0)
    expect(result.telemetry.walletIsFunded).toBe(false)
  })
})

describe('moveSettingStateToGlobal', () => {
  it('moves showSmallBalances and showSpamTokens from accounts to global settings', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { showSmallBalances: false, showSpamTokens: true },
        },
        settings: {},
      },
    }
    const result = moveSettingStateToGlobal(state)
    expect(result.wallet.settings.hideSmallBalances).toBe(true)
    expect(result.wallet.settings.hideSpamTokens).toBe(false)
    expect(result.wallet.accounts['0x123'].showSmallBalances).toBeUndefined()
    expect(result.wallet.accounts['0x123'].showSpamTokens).toBeUndefined()
  })

  it('defaults to hiding when no accounts exist', () => {
    const state = { wallet: { accounts: {}, settings: {} } }
    const result = moveSettingStateToGlobal(state)
    expect(result.wallet.settings.hideSmallBalances).toBe(true)
    expect(result.wallet.settings.hideSpamTokens).toBe(true)
  })

  it('falls back to default settings on error', () => {
    const state = {
      wallet: { accounts: createThrowingProxy({}, { throwingMethods: ['*'] }), settings: {} },
    }
    const result = moveSettingStateToGlobal(state)
    expect(result.wallet.settings.hideSmallBalances).toBe(true)
    expect(result.wallet.settings.hideSpamTokens).toBe(true)
  })
})

describe('addSkippedUnitagBoolean', () => {
  it('adds hasSkippedUnitagPrompt to behaviorHistory', () => {
    const state = { behaviorHistory: { otherFlag: true } }
    const result = addSkippedUnitagBoolean(state)
    expect(result.behaviorHistory.hasSkippedUnitagPrompt).toBe(false)
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })
})

describe('addCompletedUnitagsIntroBoolean', () => {
  it('adds hasCompletedUnitagsIntroModal to behaviorHistory', () => {
    const state = { behaviorHistory: { otherFlag: true } }
    const result = addCompletedUnitagsIntroBoolean(state)
    expect(result.behaviorHistory.hasCompletedUnitagsIntroModal).toBe(false)
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })
})

describe('addUniconV2IntroModalBoolean', () => {
  it('adds hasViewedUniconV2IntroModal to behaviorHistory', () => {
    const state = { behaviorHistory: { otherFlag: true } }
    const result = addUniconV2IntroModalBoolean(state)
    expect(result.behaviorHistory.hasViewedUniconV2IntroModal).toBe(false)
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })
})

describe('flattenTokenVisibility', () => {
  it('flattens tokensVisibility and nftsData from account-based to flat structure', () => {
    const state = {
      favorites: {
        tokensVisibility: {
          '0x123': { token1: { isVisible: true } },
          '0x456': { token2: { isVisible: false } },
        },
        nftsData: {
          '0x123': { nft1: { isHidden: false } },
        },
      },
    }
    const result = flattenTokenVisibility(state)
    expect(result.favorites.tokensVisibility['token1']).toEqual({ isVisible: true })
    expect(result.favorites.tokensVisibility['token2']).toEqual({ isVisible: false })
    expect(result.favorites.nftsVisibility).toBeDefined()
    expect(result.favorites.nftsData).toBeUndefined()
  })

  it('falls back to empty objects on error', () => {
    const state = {
      favorites: { tokensVisibility: createThrowingProxy({}, { throwingMethods: ['*'] }) },
    }
    const result = flattenTokenVisibility(state)
    expect(result.favorites.tokensVisibility).toEqual({})
    expect(result.favorites.nftsVisibility).toEqual({})
  })
})

describe('addExtensionOnboardingState', () => {
  it('adds extensionOnboardingState to behaviorHistory', () => {
    const state = { behaviorHistory: { otherFlag: true } }
    const result = addExtensionOnboardingState(state)
    expect(result.behaviorHistory.extensionOnboardingState).toBe('Undefined')
    expect(result.behaviorHistory.otherFlag).toBe(true)
  })
})

describe('resetOnboardingStateForGA', () => {
  it('resets extensionOnboardingState to Undefined', () => {
    const state = { behaviorHistory: { extensionOnboardingState: 'Completed' } }
    const result = resetOnboardingStateForGA(state)
    expect(result.behaviorHistory.extensionOnboardingState).toBe('Undefined')
  })
})

describe('deleteOldOnRampTxData', () => {
  it('removes FiatPurchaseDeprecated transactions', () => {
    const state = {
      transactions: {
        '0x123': {
          '1': {
            tx1: { typeInfo: { type: TransactionType.FiatPurchaseDeprecated } },
            tx2: { typeInfo: { type: TransactionType.Swap } },
          },
        },
      },
    }
    const result = deleteOldOnRampTxData(state)
    expect(result.transactions['0x123']['1'].tx1).toBeUndefined()
    expect(result.transactions['0x123']['1'].tx2).toBeDefined()
  })

  it('falls back to empty transactions on error', () => {
    // Create a proxy with a non-empty target so Object.keys returns keys,
    // then accessing those keys through get will throw
    const state = {
      transactions: {
        '0x123': createThrowingProxy({ '1': {} }, { throwingMethods: ['*'] }),
      },
    }
    const result = deleteOldOnRampTxData(state)
    expect(result.transactions).toEqual({})
  })
})

describe('addPushNotifications', () => {
  it('enables push notifications if any account has notifications enabled', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { pushNotificationsEnabled: true },
          '0x456': { pushNotificationsEnabled: false },
        },
      },
    }
    const result = addPushNotifications(state)
    expect(result.pushNotifications.generalUpdatesEnabled).toBe(true)
    expect(result.pushNotifications.priceAlertsEnabled).toBe(true)
  })

  it('disables push notifications if all accounts have notifications disabled', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { pushNotificationsEnabled: false },
          '0x456': { pushNotificationsEnabled: false },
        },
      },
    }
    const result = addPushNotifications(state)
    expect(result.pushNotifications.generalUpdatesEnabled).toBe(false)
    expect(result.pushNotifications.priceAlertsEnabled).toBe(false)
  })

  it('falls back to enabled on error', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': createThrowingProxy({}, { throwingMethods: ['*'] }),
        },
      },
    }
    const result = addPushNotifications(state)
    expect(result.pushNotifications.generalUpdatesEnabled).toBe(true)
    expect(result.pushNotifications.priceAlertsEnabled).toBe(true)
  })
})

describe('migrateDappRequestInfoTypes', () => {
  it('migrates uwulink source to requestType', () => {
    const state = {
      transactions: {
        '0x123': {
          '1': {
            tx1: {
              typeInfo: {
                externalDappInfo: { source: 'uwulink' },
              },
            },
          },
        },
      },
    }
    const result = migrateDappRequestInfoTypes(state)
    const dappInfo = result.transactions['0x123']['1'].tx1.typeInfo.externalDappInfo
    expect(dappInfo.requestType).toBe(DappRequestType.UwULink)
    expect(dappInfo.source).toBeUndefined()
  })

  it('migrates walletconnect source to requestType', () => {
    const state = {
      transactions: {
        '0x123': {
          '1': {
            tx1: {
              typeInfo: {
                externalDappInfo: { source: 'walletconnect' },
              },
            },
          },
        },
      },
    }
    const result = migrateDappRequestInfoTypes(state)
    const dappInfo = result.transactions['0x123']['1'].tx1.typeInfo.externalDappInfo
    expect(dappInfo.requestType).toBe(DappRequestType.WalletConnectSessionRequest)
    expect(dappInfo.source).toBeUndefined()
  })

  it('migrates WCConfirm dapp to dappRequestInfo', () => {
    const state = {
      transactions: {
        '0x123': {
          '1': {
            tx1: {
              typeInfo: {
                type: TransactionType.WCConfirm,
                dapp: { name: 'TestDapp' },
              },
            },
          },
        },
      },
    }
    const result = migrateDappRequestInfoTypes(state)
    const typeInfo = result.transactions['0x123']['1'].tx1.typeInfo
    expect(typeInfo.dappRequestInfo).toEqual({ name: 'TestDapp' })
    expect(typeInfo.dapp).toBeUndefined()
  })

  it('handles missing transactions state', () => {
    const state = { otherData: 'preserved' }
    const result = migrateDappRequestInfoTypes(state)
    expect(result.otherData).toBe('preserved')
  })

  it('falls back to empty transactions on error', () => {
    const state = {
      transactions: createThrowingProxy({}, { throwingMethods: ['*'] }),
      otherData: 'preserved',
    }
    const result = migrateDappRequestInfoTypes(state)
    expect(result.transactions).toEqual({})
    expect(result.otherData).toBe('preserved')
  })
})

describe('migrateAndRemoveCloudBackupSlice', () => {
  it('migrates cloudBackup email to wallet and removes cloudBackup', () => {
    const state = {
      cloudBackup: {
        backupsFound: [{ email: 'test@example.com' }],
      },
      wallet: {},
    }
    const result = migrateAndRemoveCloudBackupSlice(state)
    expect(result.wallet.androidCloudBackupEmail).toBe('test@example.com')
    expect(result.cloudBackup).toBeUndefined()
  })

  it('removes cloudBackup without email if no backup has email', () => {
    const state = {
      cloudBackup: { backupsFound: [] },
      wallet: {},
    }
    const result = migrateAndRemoveCloudBackupSlice(state)
    expect(result.wallet.androidCloudBackupEmail).toBeUndefined()
    expect(result.cloudBackup).toBeUndefined()
  })

  it('falls back to removing cloudBackup on error', () => {
    const state = {
      cloudBackup: createThrowingProxy({}, { throwingMethods: ['*'] }),
      wallet: {},
    }
    const result = migrateAndRemoveCloudBackupSlice(state)
    expect(result.cloudBackup).toBeUndefined()
  })
})
