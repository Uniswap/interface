import { toIncludeSameMembers } from 'jest-extended'
import { migrations } from 'src/app/migrations'
import {
  testAddAllowAnalyticsSwitch,
  testAddAppearanceSetting,
  testAddBehaviorHistory,
  testAddBiometricSettings,
  testAddCloudBackup,
  testAddCompletedUnitagsIntroBoolean,
  testAddEnsState,
  testAddExperimentsSlice,
  testAddExtensionOnboardingState,
  testAddFiatCurrencySettings,
  testAddHiddenNfts,
  testAddLanguageSettings,
  testAddLastBalancesReport,
  testAddLastBalancesReportValue,
  testAddModalsState,
  testAddPasswordLockout,
  testAddPushNotifications,
  testAddPushNotificationsEnabledToAccounts,
  testAddReplaceAccountOptions,
  testAddSearchHistory,
  testAddSkippedUnitagBoolean,
  testAddSwapProtectionSetting,
  testAddTimeImportedAndDerivationIndex,
  testAddTokensVisibility,
  testAddTweaksStartingState,
  testAddUniconV2IntroModalBoolean,
  testAddWalletConnectPendingSessionAndSettings,
  testAddWalletIsFunded,
  testChangeNativeTypeToSignerMnemonic,
  testConvertHiddenNftsToNftsData,
  testCorrectFailedFiatOnRampTxIds,
  testDeleteChainsSlice,
  testDeleteOldOnRampTxData,
  testDeleteRTKQuerySlices,
  testFilterToSupportedChains,
  testFlattenTokenVisibility,
  testMigrateAndRemoveCloudBackupSlice,
  testMigrateBiometricSettings,
  testMigrateDappRequestInfoTypes,
  testMigrateFiatPurchaseTransactionInfo,
  testMoveSettingStateToGlobal,
  testRemoveCoingeckoApiAndTokenLists,
  testRemoveDataApi,
  testRemoveDemoAccount,
  testRemoveEnsState,
  testRemoveExperimentsSlice,
  testRemoveFlashbotsEnabledFromWalletSlice,
  testRemoveLocalTypeAccounts,
  testRemoveNonZeroDerivationIndexAccounts,
  testRemovePersistedWalletConnectSlice,
  testRemoveProviders,
  testRemoveReplaceAccountOptions,
  testRemoveShowSmallBalances,
  testRemoveTokenListsAndCustomTokens,
  testRemoveTokensMetadataDisplayType,
  testRemoveWalletConnectModalState,
  testRenameFollowedAddressesToWatchedAddresses,
  testResetActiveChains,
  testResetEnsApi,
  testResetLastTxNotificationUpdate,
  testResetOnboardingStateForGA,
  testResetPushNotificationsEnabled,
  testResetTokensOrderBy,
  testResetTokensOrderByAndMetadataDisplayType,
  testRestructureTransactionsAndNotifications,
  testTransformNotificationCountToStatus,
  testUpdateLanguageSettings,
} from 'src/app/mobileMigrationTests'
import {
  getSchema,
  initialSchema,
  v1Schema,
  v2Schema,
  v3Schema,
  v4Schema,
  v5Schema,
  v6Schema,
  v7Schema,
  v8Schema,
  v9Schema,
  v10Schema,
  v11Schema,
  v12Schema,
  v13Schema,
  v14Schema,
  v15Schema,
  v16Schema,
  v17Schema,
  v18Schema,
  v19Schema,
  v20Schema,
  v21Schema,
  v22Schema,
  v23Schema,
  v24Schema,
  v25Schema,
  v26Schema,
  v27Schema,
  v28Schema,
  v29Schema,
  v31Schema,
  v32Schema,
  v33Schema,
  v34Schema,
  v35Schema,
  v36Schema,
  v37Schema,
  v38Schema,
  v39Schema,
  v40Schema,
  v41Schema,
  v42Schema,
  v43Schema,
  v44Schema,
  v45Schema,
  v46Schema,
  v47Schema,
  v48Schema,
  v49Schema,
  v50Schema,
  v51Schema,
  v52Schema,
  v53Schema,
  v54Schema,
  v55Schema,
  v56Schema,
  v57Schema,
  v58Schema,
  v59Schema,
  v60Schema,
  v61Schema,
  v62Schema,
  v63Schema,
  v64Schema,
  v65Schema,
  v66Schema,
  v67Schema,
  v68Schema,
  v69Schema,
  v70Schema,
  v71Schema,
  v72Schema,
  v73Schema,
  v74Schema,
  v75Schema,
  v76Schema,
  v77Schema,
  v78Schema,
  v79Schema,
  v80Schema,
  v81Schema,
  v82Schema,
  v83Schema,
  v84Schema,
  v85Schema,
  v86Schema,
  v87Schema,
  v88Schema,
  v89Schema,
  v90Schema,
  v91Schema,
  v92Schema,
  v93Schema,
  v95Schema,
} from 'src/app/schema'
import { persistConfig } from 'src/app/store'
import { initialBiometricsSettingsState } from 'src/features/biometricsSettings/slice'
import { initialPasswordLockoutState } from 'src/features/CloudBackup/passwordLockoutSlice'
import { initialModalsState } from 'src/features/modals/modalSlice'
import { initialPushNotificationsState } from 'src/features/notifications/slice'
import { initialTweaksState } from 'src/features/tweaks/slice'
import { initialWalletConnectState } from 'src/features/walletConnect/walletConnectSlice'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { USDC } from 'uniswap/src/constants/tokens'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { initialAppearanceSettingsState } from 'uniswap/src/features/appearance/slice'
import { initialUniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { initialFavoritesState } from 'uniswap/src/features/favorites/slice'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { initialNotificationsState } from 'uniswap/src/features/notifications/slice/slice'
import { initialSearchHistoryState } from 'uniswap/src/features/search/searchHistorySlice'
import { initialUserSettingsState } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { initialTokensState } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { initialTransactionsState } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { initialVisibilityState } from 'uniswap/src/features/visibility/slice'
import {
  testAddActivityVisibility,
  testMigrateDismissedTokenWarnings,
  testMigrateSearchHistory,
  testRemoveTHBFromCurrency,
} from 'uniswap/src/state/uniswapMigrationTests'
import { transactionDetails } from 'uniswap/src/test/fixtures'
import { DappRequestType } from 'uniswap/src/types/walletConnect'
import { getAllKeysOfNestedObject } from 'utilities/src/primitives/objects'
import { initialBatchedTransactionsState } from 'wallet/src/features/batchedTransactions/slice'
import { initialBehaviorHistoryState } from 'wallet/src/features/behaviorHistory/slice'
import { initialTelemetryState } from 'wallet/src/features/telemetry/slice'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { initialWalletState, SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { createMigrate } from 'wallet/src/state/createMigrate'
import { HAYDEN_ETH_ADDRESS } from 'wallet/src/state/walletMigrations'
import {
  testActivatePendingAccounts,
  testAddBatchedTransactions,
  testAddCreatedOnboardingRedesignAccount,
  testAddExploreAndWelcomeBehaviorHistory,
  testAddedHapticSetting,
  testAddRoutingFieldToTransactions,
  testDeleteBetaOnboardingState,
  testDeleteDefaultFavoritesFromFavoritesState,
  testDeleteExtensionOnboardingState,
  testDeleteWelcomeWalletCard,
  testMigrateLiquidityTransactionInfoRename,
  testMovedCurrencySetting,
  testMovedLanguageSetting,
  testMovedTokenWarnings,
  testMovedUserSettings,
  testMoveHapticsToUserSettings,
  testMoveTokenAndNFTVisibility,
  testRemoveCreatedOnboardingRedesignAccount,
  testRemoveHoldToSwap,
  testRemovePriceAlertsEnabledFromPushNotifications,
  testRemoveUniconV2BehaviorState,
  testRemoveWalletIsUnlockedState,
  testUnchecksumDismissedTokenWarningKeys,
  testUpdateExploreOrderByType,
} from 'wallet/src/state/walletMigrationsTests'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

expect.extend({ toIncludeSameMembers })

const account = signerMnemonicAccount()

const txDetailsConfirmed = transactionDetails({
  status: TransactionStatus.Success,
})
const fiatOnRampTxDetailsFailed = {
  ...transactionDetails({
    status: TransactionStatus.Failed,
  }),
  typeInfo: {
    type: TransactionType.FiatPurchaseDeprecated,
    explorerUrl:
      'https://buy-sandbox.moonpay.com/transaction_receipt?transactionId=d6c32bb5-7cd9-4c22-8f46-6bbe786c599f',
    id: 'd6c32bb5-7cd9-4c22-8f46-6bbe786c599f',
  },
}

describe('Redux state migrations', () => {
  it('is able to perform all migrations starting from the initial schema', async () => {
    const initialSchemaStub = {
      ...initialSchema,
      _persist: { version: -1, rehydrated: false },
    }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(initialSchemaStub, persistConfig.version)
    expect(typeof migratedSchema).toBe('object')
  })

  // If this test fails then it's likely a required property was added to the Redux state but a migration was not defined
  it('migrates all the properties correctly', async () => {
    const initialSchemaStub = {
      ...initialSchema,
      _persist: { version: -1, rehydrated: false },
    }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(initialSchemaStub, persistConfig.version)

    // Add new slices here!
    const initialState = {
      appearanceSettings: initialAppearanceSettingsState,
      batchedTransactions: initialBatchedTransactionsState,
      biometricSettings: initialBiometricsSettingsState,
      blocks: { byChainId: {} },
      chains: {
        byChainId: {
          '1': { isActive: true },
          '10': { isActive: true },
          '137': { isActive: true },
          '42161': { isActive: true },
        },
      },
      ens: { ensForAddress: {} },
      favorites: initialFavoritesState,
      fiatCurrencySettings: { currentCurrency: FiatCurrency.UnitedStatesDollar },
      modals: initialModalsState,
      notifications: initialNotificationsState,
      passwordLockout: initialPasswordLockoutState,
      behaviorHistory: initialBehaviorHistoryState,
      providers: { isInitialized: false },
      pushNotifications: initialPushNotificationsState,
      saga: {},
      searchHistory: initialSearchHistoryState,
      telemetry: initialTelemetryState,
      tokenLists: {},
      tokens: initialTokensState,
      transactions: initialTransactionsState,
      tweaks: initialTweaksState,
      uniswapBehaviorHistory: initialUniswapBehaviorHistoryState,
      userSettings: initialUserSettingsState,
      visibility: initialVisibilityState,
      wallet: initialWalletState,
      walletConnect: initialWalletConnectState,
      _persist: {
        version: persistConfig.version,
        rehydrated: true,
      },
    }

    if (!migratedSchema) {
      throw new Error('Migrated schema is undefined')
    }

    const migratedSchemaKeys = new Set(getAllKeysOfNestedObject(migratedSchema))
    const latestSchemaKeys = new Set(getAllKeysOfNestedObject(getSchema()))
    const initialStateKeys = new Set(getAllKeysOfNestedObject(initialState))

    for (const key of initialStateKeys) {
      if (latestSchemaKeys.has(key)) {
        latestSchemaKeys.delete(key)
      }
      if (migratedSchemaKeys.has(key)) {
        migratedSchemaKeys.delete(key)
      }
      initialStateKeys.delete(key)
    }

    expect(Array.from(migratedSchemaKeys)).toEqual([])
    expect(Array.from(latestSchemaKeys)).toEqual([])
    expect(Array.from(initialStateKeys)).toEqual([])
  })

  // This is a precaution to ensure we do not attempt to access undefined properties during migrations
  // If this test fails, make sure all property references to state are using optional chaining
  it('uses optional chaining when accessing old state variables', async () => {
    const emptyStub = { _persist: { version: -1, rehydrated: false } }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(emptyStub, persistConfig.version)
    expect(typeof migratedSchema).toBe('object')
  })

  it('migrates from initialSchema to v0Schema', () => {
    testRestructureTransactionsAndNotifications(migrations[0], initialSchema)
  })

  it('migrates from v0 to v1', () => {
    testRemoveWalletConnectModalState(migrations[1], migrations[0](initialSchema))
  })

  it('migrates from v1 to v2', () => {
    testRenameFollowedAddressesToWatchedAddresses(migrations[2], v1Schema)
  })

  it('migrates from v2 to v3', () => {
    testAddSearchHistory(migrations[3], v2Schema)
  })

  it('migrates from v3 to v4', () => {
    testAddTimeImportedAndDerivationIndex(migrations[4], v3Schema)
  })

  it('migrates from v4 to v5', () => {
    testAddModalsState(migrations[5], v4Schema)
  })

  it('migrates from v5 to v6', () => {
    testAddWalletConnectPendingSessionAndSettings(migrations[6], v5Schema)
  })

  it('migrates from v6 to v7', () => {
    testRemoveNonZeroDerivationIndexAccounts(migrations[7], v6Schema)
  })

  it('migrates from v7 to v8', () => {
    testAddCloudBackup(migrations[8], v7Schema)
  })

  it('migrates from v8 to v9', () => {
    testRemoveLocalTypeAccounts(migrations[9], v8Schema)
  })

  it('migrates from v9 to v10', () => {
    testRemoveDemoAccount(migrations[10], v9Schema)
  })

  it('migrates from v10 to v11', () => {
    testAddBiometricSettings(migrations[11], v10Schema)
  })

  it('migrates from v11 to v12', () => {
    testAddPushNotificationsEnabledToAccounts(migrations[12], v11Schema)
  })

  it('migrates from v12 to v13', () => {
    testAddEnsState(migrations[13], v12Schema)
  })

  it('migrates from v13 to v14', () => {
    testMigrateBiometricSettings(migrations[14], v13Schema)
  })

  it('migrates from v14 to v15', () => {
    testChangeNativeTypeToSignerMnemonic(migrations[15], v14Schema)
  })

  it('migrates from v15 to v16', () => {
    testRemoveDataApi(migrations[16], v15Schema)
  })

  it('migrates from v16 to v17', () => {
    testResetPushNotificationsEnabled(migrations[17], v16Schema)
  })

  it('migrates from v17 to v18', () => {
    testRemoveEnsState(migrations[18], v17Schema)
  })

  it('migrates from v18 to v19', () => {
    testFilterToSupportedChains(migrations[19], v18Schema)
  })

  it('migrates from v19 to v20', () => {
    testResetLastTxNotificationUpdate(migrations[20], v19Schema)
  })

  it('migrates from v20 to v21', () => {
    testAddExperimentsSlice(migrations[21], v20Schema)
  })

  it('migrates from v21 to v22', () => {
    testRemoveCoingeckoApiAndTokenLists(migrations[22], v21Schema)
  })

  it('migrates from v22 to v23', () => {
    testResetTokensOrderByAndMetadataDisplayType(migrations[23], v22Schema)
  })

  it('migrates from v23 to v24', () => {
    testTransformNotificationCountToStatus(migrations[24], v23Schema)
  })

  it('migrates from v24 to v25', () => {
    testAddPasswordLockout(migrations[25], v24Schema)
  })

  it('migrates from v25 to v26', () => {
    testRemoveShowSmallBalances(migrations[26], v25Schema)
  })

  it('migrates from v26 to v27', () => {
    testResetTokensOrderBy(migrations[27], v26Schema)
  })

  it('migrates from v27 to v28', () => {
    testRemoveTokensMetadataDisplayType(migrations[28], v27Schema)
  })

  it('migrates from v28 to v29', () => {
    testRemoveTokenListsAndCustomTokens(migrations[29], v28Schema)
  })

  it('migrates from v29 to v30', () => {
    testMigrateFiatPurchaseTransactionInfo(migrations[30], v29Schema, account, txDetailsConfirmed)
  })

  it('migrates from v31 to 32', () => {
    testResetEnsApi(migrations[32], v31Schema)
  })

  it('migrates from v32 to 33', () => {
    testAddReplaceAccountOptions(migrations[33], v32Schema)
  })

  it('migrates from v33 to 34', () => {
    testAddLastBalancesReport(migrations[34], v33Schema)
  })

  it('migrates from v34 to 35', () => {
    testAddAppearanceSetting(migrations[35], v34Schema)
  })

  it('migrates from v35 to 36', () => {
    testAddHiddenNfts(migrations[36], v35Schema)
  })

  it('migrates from v36 to 37', () => {
    testCorrectFailedFiatOnRampTxIds(migrations[37], v36Schema, account, fiatOnRampTxDetailsFailed, txDetailsConfirmed)
  })

  it('migrates from v37 to 38', () => {
    testRemoveReplaceAccountOptions(migrations[38], v37Schema)
  })

  it('migrates from v38 to 39', () => {
    testRemoveExperimentsSlice(migrations[39], v38Schema)
  })

  it('migrates from v39 to 40', () => {
    testRemovePersistedWalletConnectSlice(migrations[40], v39Schema)
  })

  it('migrates from v40 to 41', () => {
    testAddLastBalancesReportValue(migrations[41], v40Schema)
  })

  it('migrates from v41 to 42', () => {
    testRemoveFlashbotsEnabledFromWalletSlice(migrations[42], v41Schema)
  })

  it('migrates from v42 to 43', () => {
    testConvertHiddenNftsToNftsData(migrations[43], v42Schema)
  })

  it('migrates from v43 to v44', () => {
    testRemoveProviders(migrations[44], v43Schema)
  })

  it('migrates from v44 to 45', () => {
    testAddTokensVisibility(migrations[45], v44Schema)
  })

  it('migrates from v45 to 46', () => {
    testDeleteRTKQuerySlices(migrations[46], v45Schema)
  })

  it('migrates from v46 to 47', () => {
    testResetActiveChains(migrations[47], v46Schema)
  })

  it('migrates from v47 to 48', () => {
    testAddTweaksStartingState(migrations[48], v47Schema)
  })

  it('migrates from v48 to 49', () => {
    testAddSwapProtectionSetting(migrations[49], v48Schema)
  })

  it('migrates from v49 to 50', () => {
    testDeleteChainsSlice(migrations[50], v49Schema)
  })

  it('migrates from v50 to 51', () => {
    testAddLanguageSettings(migrations[51], v50Schema)
  })

  it('migrates from v51 to 52', () => {
    testAddFiatCurrencySettings(migrations[52], v51Schema)
  })

  it('migrates from v52 to 53', () => {
    testUpdateLanguageSettings(migrations[53], v52Schema)
  })

  it('migrates from v53 to 54', () => {
    testAddWalletIsFunded(migrations[54], v53Schema)
  })

  it('migrates from v54 to 55', () => {
    testAddBehaviorHistory(migrations[55], v54Schema)
  })

  it('migrates from v55 to 56', () => {
    testAddAllowAnalyticsSwitch(migrations[56], v55Schema)
  })

  it('migrates from v56 to 57', () => {
    testMoveSettingStateToGlobal(migrations[57], v56Schema)
  })

  it('migrates from v57 to 58', () => {
    testAddSkippedUnitagBoolean(migrations[58], v57Schema)
  })

  it('migrates from v58 to 59', () => {
    testAddCompletedUnitagsIntroBoolean(migrations[59], v58Schema)
  })

  it('migrates from v59 to 60', () => {
    testAddUniconV2IntroModalBoolean(migrations[60], v59Schema)
  })

  it('migrates from v60 to 61', () => {
    testFlattenTokenVisibility(migrations[61], v60Schema)
  })

  it('migrates from v61 to 62', () => {
    testAddExtensionOnboardingState(migrations[62], v61Schema)
  })

  it('migrates from v62 to 63', () => {
    testRemoveWalletIsUnlockedState(migrations[63], v62Schema)
  })

  it('migrates from v63 to 64', () => {
    testRemoveUniconV2BehaviorState(migrations[64], v63Schema)
  })

  it('migrates from v64 to 65', () => {
    testAddRoutingFieldToTransactions(migrations[65], v64Schema)
  })
  it('migrates from v65 to v66', () => {
    const v66 = migrations[66]
    testActivatePendingAccounts(v66, v65Schema)
  })

  it('migrates from v66 to v67', () => {
    testResetOnboardingStateForGA(migrations[67], v66Schema)
  })

  it('migrates from v67 to v68', () => {
    testDeleteBetaOnboardingState(migrations[68], v67Schema)
  })

  it('migrates from v68 to v69', async () => {
    testDeleteExtensionOnboardingState(migrations[69], v68Schema)
  })

  it('migrates from v69 to v70', async () => {
    testDeleteDefaultFavoritesFromFavoritesState(migrations[70], v69Schema, HAYDEN_ETH_ADDRESS)
  })

  it('migrates from v70 to v71', async () => {
    testAddedHapticSetting(migrations[71], v70Schema)
  })

  it('migrates from v71 to v72', () => {
    testAddExploreAndWelcomeBehaviorHistory(migrations[72], v71Schema)
  })

  it('migrates from v72 to v73', async () => {
    testMovedUserSettings(migrations[73], v72Schema)
  })

  it('migrates from v73 to v74', () => {
    testDeleteOldOnRampTxData(migrations[74], v73Schema, account, txDetailsConfirmed)
  })

  it('migrates from v74 to v75', () => {
    testRemoveHoldToSwap(migrations[75], v74Schema)
  })

  it('migrates from v75 to v76', () => {
    testAddCreatedOnboardingRedesignAccount(migrations[76], v75Schema)
  })

  it('migrates from v76 to v77', async () => {
    testMovedTokenWarnings(migrations[77], v76Schema)
  })

  it('migrates from v77 to v78', async () => {
    testMovedLanguageSetting(migrations[78], v77Schema)
  })

  it('migrates from v78 to v79', async () => {
    testMovedCurrencySetting(migrations[79], v78Schema)
  })

  it('migrates from v79 to v80', async () => {
    testUpdateExploreOrderByType(migrations[80], v79Schema)
  })

  it('migrates from v80 to v81', async () => {
    testRemoveCreatedOnboardingRedesignAccount(migrations[81], v80Schema)
  })

  it('migrates from v81 to v82', () => {
    testUnchecksumDismissedTokenWarningKeys(migrations[82], v81Schema)
  })

  it('migrates from v82 to v83', () => {
    testAddPushNotifications(migrations[83], v82Schema)
  })

  it('migrates from v83 to v84', () => {
    testDeleteWelcomeWalletCard(migrations[84], v83Schema)
  })

  it('migrates from v84 to v85', () => {
    testMoveTokenAndNFTVisibility(migrations[85], v84Schema)
  })

  it('migrates from v85 to v86', () => {
    testAddBatchedTransactions(migrations[86], v85Schema)
  })

  it('migrates from v86 to v87', () => {
    testMigrateDappRequestInfoTypes(migrations[87], v86Schema)
  })

  it('migrates from v87 to v88', () => {
    testMoveHapticsToUserSettings(migrations[88], v87Schema)
  })

  it('migrates from v88 to v89', () => {
    const v88Stub = { ...v88Schema, userSettings: { ...v88Schema.userSettings, currentCurrency: 'THB' } }
    testRemoveTHBFromCurrency(migrations[89], v88Stub)

    const v88Stub2 = { ...v88Schema, userSettings: { ...v88Schema.userSettings, currentCurrency: 'JPY' } }
    testRemoveTHBFromCurrency(migrations[89], v88Stub2)
  })

  it('migrates from v89 to v90', () => {
    testMigrateLiquidityTransactionInfoRename(migrations[90], v89Schema)
  })

  it('migrates from v90 to v91', () => {
    testRemovePriceAlertsEnabledFromPushNotifications(migrations[91], v90Schema)
  })

  it('migrates from v91 to v92', () => {
    testMigrateAndRemoveCloudBackupSlice(migrations[92], v91Schema)
  })

  it('migrates from v92 to v93', () => {
    testMigrateSearchHistory(migrations[93], v92Schema)
  })

  it('migrates from v93 to v95', () => {
    testAddActivityVisibility(migrations[95], v93Schema)
  })

  it('migrates from v95 to v96', () => {
    testMigrateDismissedTokenWarnings(migrations[96], {
      ...v95Schema,
      tokens: {
        dismissedTokenWarnings: {
          [UniverseChainId.Mainnet]: {
            [USDC.address]: {
              chainId: UniverseChainId.Mainnet,
              address: USDC.address,
            },
          },
        },
      },
    })
  })
})
