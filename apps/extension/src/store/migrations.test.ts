/* eslint-disable jest/expect-expect */
import { BigNumber } from '@ethersproject/bignumber'
import { toIncludeSameMembers } from 'jest-extended'
import {
  testMigratePendingDappRequestsToRecord,
  testMigrateUnknownBackupAccountsToMaybeManualBackup,
} from 'src/store/extensionMigrationsTests'
import { EXTENSION_STATE_VERSION, migrations } from 'src/store/migrations'
import {
  getSchema,
  initialSchema,
  v0Schema,
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
} from 'src/store/schema'
import { initialUniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { initialFavoritesState } from 'uniswap/src/features/favorites/slice'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { initialNotificationsState } from 'uniswap/src/features/notifications/slice/slice'
import { initialSearchHistoryState } from 'uniswap/src/features/search/searchHistorySlice'
import { initialUserSettingsState } from 'uniswap/src/features/settings/slice'
import { initialTokensState } from 'uniswap/src/features/tokens/slice/slice'
import { initialTransactionsState } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { initialVisibilityState } from 'uniswap/src/features/visibility/slice'
import {
  testAddActivityVisibility,
  testMigrateSearchHistory,
  testRemoveTHBFromCurrency,
} from 'uniswap/src/state/uniswapMigrationTests'
import { getAllKeysOfNestedObject } from 'utilities/src/primitives/objects'
import { initialAppearanceSettingsState } from 'wallet/src/features/appearance/slice'
import { initialBatchedTransactionsState } from 'wallet/src/features/batchedTransactions/slice'
import { initialBehaviorHistoryState } from 'wallet/src/features/behaviorHistory/slice'
import { initialWalletState } from 'wallet/src/features/wallet/slice'
import { createMigrate } from 'wallet/src/state/createMigrate'
import { HAYDEN_ETH_ADDRESS } from 'wallet/src/state/walletMigrations'
import {
  testActivatePendingAccounts,
  testAddBatchedTransactions,
  testAddCreatedOnboardingRedesignAccount,
  testAddedHapticSetting,
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
  testUnchecksumDismissedTokenWarningKeys,
  testUpdateExploreOrderByType,
} from 'wallet/src/state/walletMigrationsTests'

expect.extend({ toIncludeSameMembers })

describe('Redux state migrations', () => {
  it('is able to perform all migrations starting from the initial schema', async () => {
    const initialSchemaStub = {
      ...initialSchema,
      _persist: { version: -1, rehydrated: false },
    }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(initialSchemaStub, EXTENSION_STATE_VERSION)
    expect(typeof migratedSchema).toBe('object')
  })

  // If this test fails then it's likely a required property was added to the Redux state but a migration was not defined
  it('migrates all the properties correctly', async () => {
    const initialSchemaStub = {
      ...initialSchema,
      _persist: { version: -1, rehydrated: false },
    }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(initialSchemaStub, EXTENSION_STATE_VERSION)

    // Add new slices here!
    const initialState = {
      appearanceSettings: initialAppearanceSettingsState,
      dappRequests: {
        requests: {},
      },
      batchedTransactions: initialBatchedTransactionsState,
      blocks: { byChainId: {} },
      chains: {
        byChainId: {
          '1': { isActive: true },
          '10': { isActive: true },
          '137': { isActive: true },
          '42161': { isActive: true },
        },
      },
      dapp: {},
      ens: { ensForAddress: {} },
      favorites: initialFavoritesState,
      fiatCurrencySettings: { currentCurrency: FiatCurrency.UnitedStatesDollar },
      notifications: initialNotificationsState,
      behaviorHistory: initialBehaviorHistoryState,
      providers: { isInitialized: false },
      saga: {},
      searchHistory: initialSearchHistoryState,
      tokenLists: {},
      tokens: initialTokensState,
      transactions: initialTransactionsState,
      uniswapBehaviorHistory: initialUniswapBehaviorHistoryState,
      userSettings: initialUserSettingsState,
      visibility: initialVisibilityState,
      wallet: initialWalletState,
      _persist: {
        version: EXTENSION_STATE_VERSION,
        rehydrated: true,
      },
    }

    const migratedSchemaKeys = new Set(getAllKeysOfNestedObject(migratedSchema as Record<string, unknown>))
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

    expect(migratedSchemaKeys.size).toBe(0)
    expect(latestSchemaKeys.size).toBe(0)
    expect(initialStateKeys.size).toBe(0)
  })

  // This is a precaution to ensure we do not attempt to access undefined properties during migrations
  // If this test fails, make sure all property references to state are using optional chaining
  it('uses optional chaining when accessing old state variables', async () => {
    const emptyStub = { _persist: { version: -1, rehydrated: false } }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(emptyStub, EXTENSION_STATE_VERSION)
    expect(typeof migratedSchema).toBe('object')
  })

  it('migrates from initial schema to v0', () => {
    const stub = { ...initialSchema }
    const v0 = migrations[0](stub)

    expect(v0.wallet.isUnlocked).toBe(undefined)
  })

  it('migrates from v0 to v1', () => {
    const v0Stub = { ...v0Schema }
    const v1 = migrations[1](v0Stub)

    expect(v1.behaviorHistory.hasViewedUniconV2IntroModal).toBe(undefined)
  })

  it('migrates from v1 to v2', () => {
    const TEST_ADDRESS = '0xTestAddress'
    const txDetails0 = {
      chainId: UniverseChainId.Mainnet,
      id: '0',
      from: '0xTestAddress',
      options: {
        request: {
          from: '0x123',
          to: '0x456',
          value: '0x0',
          data: '0x789',
          nonce: 10,
          gasPrice: BigNumber.from('10000'),
        },
      },
      typeInfo: {
        type: TransactionType.Approve,
        tokenAddress: '0xtokenAddress',
        spender: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      },
      status: TransactionStatus.Pending,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const txDetails1 = {
      ...txDetails0,
      chainId: UniverseChainId.Optimism,
      id: '1',
    }

    const transactions = {
      [TEST_ADDRESS]: {
        [UniverseChainId.Mainnet]: {
          '0': txDetails0,
        },
        [UniverseChainId.Optimism]: {
          '1': txDetails1,
        },
      },
    }

    const v0stub = { ...v1Schema, transactions }

    const v64 = migrations[2](v0stub)

    expect(v64.transactions[TEST_ADDRESS][UniverseChainId.Mainnet]['0'].routing).toBe('CLASSIC')
    expect(v64.transactions[TEST_ADDRESS][UniverseChainId.Optimism]['1'].routing).toBe('CLASSIC')
  })

  it('migrates from v2 to v3', () => {
    testActivatePendingAccounts(migrations[3], v2Schema)
  })

  it('migrates from v3 to v4', async () => {
    const v3Stub = { ...v3Schema }
    const v4 = await migrations[4](v3Stub)
    expect(v4.dapp).toBe(undefined)
  })

  it('migrates from v4 to v5', async () => {
    const v4Stub = { ...v4Schema }
    const v5 = await migrations[5](v4Stub)
    expect(v5.behaviorHistory.extensionBetaFeedbackState).toBe(undefined)
  })

  it('migrates from v5 to v6', async () => {
    const v5Stub = { ...v5Schema }
    const v6 = await migrations[6](v5Stub)
    expect(v6.behaviorHistory.extensionOnboardingState).toBe(undefined)
  })

  it('migrates from v6 to v7', async () => {
    const v6Stub = { ...v6Schema }
    v6Stub.favorites.watchedAddresses = [HAYDEN_ETH_ADDRESS] as never
    const v7 = await migrations[7](v6Stub)
    expect(v7.favorites.watchedAddresses).toEqual([])
  })

  it('migrates from v7 to v8', async () => {
    testAddedHapticSetting(migrations[8], v7Schema)
  })

  it('migrates from v8 to v9', async () => {
    const v8Stub = { ...v8Schema }
    const v9 = await migrations[9](v8Stub)

    expect(v9.behaviorHistory.hasUsedExplore).toBe(false)
    expect(v9.behaviorHistory.hasViewedWelcomeWalletCard).toBe(false)
  })

  it('migrates from v9 to v10', async () => {
    testMovedUserSettings(migrations[10], v9Schema)
  })

  it('migrates from v10 to v11', async () => {
    testRemoveHoldToSwap(migrations[11], v10Schema)
  })

  it('migrates from v11 to v12', async () => {
    testAddCreatedOnboardingRedesignAccount(migrations[12], v11Schema)
  })

  it('migrates from v12 to v13', async () => {
    testMovedTokenWarnings(migrations[13], v12Schema)
  })

  it('migrates from v13 to v14', async () => {
    testMovedLanguageSetting(migrations[14], v13Schema)
  })

  it('migrates from v14 to v15', async () => {
    testMovedCurrencySetting(migrations[15], v14Schema)
  })

  it('migrates from v15 to v16', async () => {
    testUpdateExploreOrderByType(migrations[16], v15Schema)
  })

  it('migrates from v16 to v17', async () => {
    testRemoveCreatedOnboardingRedesignAccount(migrations[17], v16Schema)
  })

  it('migrates from v17 to v18', () => {
    testUnchecksumDismissedTokenWarningKeys(migrations[18], v17Schema)
  })

  it('migrates from v18 to v19', () => {
    testDeleteWelcomeWalletCard(migrations[19], v18Schema)
  })

  it('migrates from v19 to v20', () => {
    testMoveTokenAndNFTVisibility(migrations[20], v19Schema)
  })

  it('migrates from v20 to v21', () => {
    testMigratePendingDappRequestsToRecord(migrations[21], v20Schema)
  })

  it('migrates from v21 to v22', () => {
    testAddBatchedTransactions(migrations[22], v21Schema)
  })

  it('migrates from v22 to v23', () => {
    testMigrateUnknownBackupAccountsToMaybeManualBackup(migrations[23], v22Schema)
  })

  it('migrates from v23 to v24', () => {
    testMoveHapticsToUserSettings(migrations[24], v23Schema)
  })

  it('migrates from v24 to v25', () => {
    const v24Stub = { ...v24Schema, userSettings: { ...v24Schema.userSettings, currentCurrency: 'THB' } }
    testRemoveTHBFromCurrency(migrations[25], v24Stub)

    const v24Stub2 = { ...v24Schema, userSettings: { ...v24Schema.userSettings, currentCurrency: 'JPY' } }
    testRemoveTHBFromCurrency(migrations[25], v24Stub2)
  })

  it('migrates from v25 to v26', () => {
    testMigrateLiquidityTransactionInfoRename(migrations[26], v25Schema)
  })

  it('migrates from v26 to v27', () => {
    testMigrateSearchHistory(migrations[27], v26Schema)
  })

  it('migrates from v27 to v29', () => {
    testAddActivityVisibility(migrations[29], v27Schema)
  })
})
