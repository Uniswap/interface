import { BigNumber } from 'ethers'
import { toIncludeSameMembers } from 'jest-extended'
import { EXTENSION_STATE_VERSION, migrations } from 'src/store/migrations'
import { getSchema, initialSchema, v0Schema, v1Schema, v2Schema, v3Schema } from 'src/store/schema'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { initialBehaviorHistoryState } from 'wallet/src/features/behaviorHistory/slice'
import { initialFavoritesState } from 'wallet/src/features/favorites/slice'
import { initialFiatCurrencyState } from 'wallet/src/features/fiatCurrency/slice'
import { initialLanguageState } from 'wallet/src/features/language/slice'
import { initialNotificationsState } from 'wallet/src/features/notifications/slice'
import { initialSearchHistoryState } from 'wallet/src/features/search/searchHistorySlice'
import { initialTokensState } from 'wallet/src/features/tokens/tokensSlice'
import { initialTransactionsState } from 'wallet/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { initialWalletState } from 'wallet/src/features/wallet/slice'
import { createMigrate } from 'wallet/src/state/createMigrate'
import { testActivatePendingAccounts } from 'wallet/src/state/sharedMigrationsTests'
import { getAllKeysOfNestedObject } from 'wallet/src/state/testUtils'

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
      appearanceSettings: { selectedAppearanceSettings: 'system' },
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
      fiatCurrencySettings: initialFiatCurrencyState,
      languageSettings: initialLanguageState,
      notifications: initialNotificationsState,
      behaviorHistory: initialBehaviorHistoryState,
      providers: { isInitialized: false },
      saga: {},
      searchHistory: initialSearchHistoryState,
      tokenLists: {},
      tokens: initialTokensState,
      transactions: initialTransactionsState,
      wallet: initialWalletState,
      _persist: {
        version: EXTENSION_STATE_VERSION,
        rehydrated: true,
      },
    }

    const migratedSchemaKeys = new Set(
      getAllKeysOfNestedObject(migratedSchema as Record<string, unknown>)
    )
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
    const v3 = migrations[3]
    testActivatePendingAccounts(v3, v2Schema)
  })

  it('migrates from v3 to v4', async () => {
    const v3Stub = { ...v3Schema }
    const v4 = await migrations[4](v3Stub)
    expect(v4.dapp).toBe(undefined)
  })
})
