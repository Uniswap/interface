import { BigNumber } from '@ethersproject/bignumber'
import { toIncludeSameMembers } from 'jest-extended'
import mockdate from 'mockdate'
import { migrations, OLD_DEMO_ACCOUNT_ADDRESS } from 'src/app/migrations'
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
import { initialAppearanceSettingsState } from 'wallet/src/features/appearance/slice'
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
  testRemovePriceAlertsEnabledFromPushNotifications,
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
    const txDetails0 = {
      chainId: UniverseChainId.Mainnet,
      id: '0',
      from: '0xShadowySuperCoder',
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
      chainId: UniverseChainId.Optimism,
      id: '1',
      from: '0xKingHodler',
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
      status: TransactionStatus.Success,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const initialSchemaStub = {
      ...initialSchema,
      transactions: {
        byChainId: {
          [UniverseChainId.Mainnet]: {
            '0': txDetails0,
          },
          [UniverseChainId.Optimism]: {
            '1': txDetails1,
          },
        },
        lastTxHistoryUpdate: {
          '0xShadowySuperCoder': 12345678912345,
          '0xKingHodler': 9876543210987,
        },
      },
    }

    const newSchema = migrations[0](initialSchemaStub)
    expect(newSchema.transactions[UniverseChainId.Mainnet]).toBeUndefined()
    expect(newSchema.transactions.lastTxHistoryUpdate).toBeUndefined()

    expect(newSchema.transactions['0xShadowySuperCoder'][UniverseChainId.Mainnet]['0'].status).toEqual(
      TransactionStatus.Pending,
    )
    expect(newSchema.transactions['0xKingHodler'][UniverseChainId.Mainnet]).toBeUndefined()
    expect(newSchema.transactions['0xKingHodler'][UniverseChainId.Optimism]['0']).toBeUndefined()
    expect(newSchema.transactions['0xKingHodler'][UniverseChainId.Optimism]['1'].from).toEqual('0xKingHodler')

    expect(newSchema.notifications.lastTxNotificationUpdate).toBeDefined()
    expect(newSchema.notifications.lastTxNotificationUpdate['0xShadowySuperCoder'][UniverseChainId.Mainnet]).toEqual(
      12345678912345,
    )
  })

  it('migrates from v0 to v1', () => {
    const initialSchemaStub = {
      ...initialSchema,
      walletConnect: {
        ...initialSchema.wallet,
        modalState: ScannerModalState.ScanQr,
      },
    }

    const v0 = migrations[0](initialSchemaStub)
    const v1 = migrations[1](v0)
    expect(v1.walletConnect.modalState).toEqual(undefined)
  })

  it('migrates from v1 to v2', () => {
    const TEST_ADDRESSES = ['0xTest']

    const v1SchemaStub = {
      ...v1Schema,
      favorites: {
        ...v1Schema.favorites,
        followedAddresses: TEST_ADDRESSES,
      },
    }

    const v2 = migrations[2](v1SchemaStub)

    expect(v2.favorites.watchedAddresses).toEqual(TEST_ADDRESSES)
    expect(v2.favorites.followedAddresses).toBeUndefined()
  })

  it('migrates from v2 to v3', () => {
    const v3 = migrations[3](v2Schema)
    expect(v3.searchHistory.results).toEqual([])
  })

  it('migrates from v3 to v4', () => {
    const TEST_ADDRESSES = ['0xTest', '0xTest2', '0xTest3', '0xTest4']
    const TEST_IMPORT_TIME_MS = 12345678912345

    const v3SchemaStub = {
      ...v3Schema,
      wallet: {
        ...v3Schema.wallet,
        accounts: [
          {
            type: AccountType.Readonly,
            address: TEST_ADDRESSES[0],
            name: 'Test Account 1',
            pending: false,
          },
          {
            type: AccountType.Readonly,
            address: TEST_ADDRESSES[1],
            name: 'Test Account 2',
            pending: false,
          },
          {
            type: 'native',
            address: TEST_ADDRESSES[2],
            name: 'Test Account 3',
            pending: false,
          },
          {
            type: 'native',
            address: TEST_ADDRESSES[3],
            name: 'Test Account 4',
            pending: false,
          },
        ],
      },
    }

    mockdate.set(TEST_IMPORT_TIME_MS)

    const v4 = migrations[4](v3SchemaStub)
    expect(v4.wallet.accounts[0].timeImportedMs).toEqual(TEST_IMPORT_TIME_MS)
    expect(v4.wallet.accounts[2].derivationIndex).toBeDefined()
  })

  it('migrates from v4 to v5', () => {
    const v5 = migrations[5](v4Schema)

    expect(v4Schema.balances).toBeDefined()
    expect(v5.balances).toBeUndefined()

    expect(v5.modals[ModalName.Swap].isOpen).toEqual(false)
    expect(v5.modals[ModalName.Send].isOpen).toEqual(false)
  })

  it('migrates from v5 to v6', () => {
    const v6 = migrations[6](v5Schema)

    expect(v6.walletConnect.pendingSession).toBe(null)

    expect(typeof v6.wallet.settings).toBe('object')

    expect(v5Schema.wallet.bluetooth).toBeDefined()
    expect(v6.wallet.bluetooth).toBeUndefined()
  })

  it('migrates from v6 to v7', () => {
    const TEST_ADDRESSES: [string, string, string, string] = ['0xTest', '0xTest2', '0xTest3', '0xTest4']
    const TEST_IMPORT_TIME_MS = 12345678912345

    const v6SchemaStub = {
      ...v6Schema,
      wallet: {
        ...v6Schema.wallet,
        accounts: {
          [TEST_ADDRESSES[0]]: {
            type: 'native',
            address: TEST_ADDRESSES[0],
            name: 'Test Account 1',
            pending: false,
            derivationIndex: 0,
            timeImportedMs: TEST_IMPORT_TIME_MS,
          },
          [TEST_ADDRESSES[1]]: {
            type: 'native',
            address: TEST_ADDRESSES[1],
            name: 'Test Account 2',
            pending: false,
            derivationIndex: 1,
            timeImportedMs: TEST_IMPORT_TIME_MS,
          },
          [TEST_ADDRESSES[2]]: {
            type: 'native',
            address: TEST_ADDRESSES[2],
            name: 'Test Account 3',
            pending: false,
            derivationIndex: 2,
            timeImportedMs: TEST_IMPORT_TIME_MS,
          },
          [TEST_ADDRESSES[3]]: {
            type: 'native',
            address: TEST_ADDRESSES[3],
            name: 'Test Account 4',
            pending: false,
            derivationIndex: 3,
            timeImportedMs: TEST_IMPORT_TIME_MS,
          },
        },
      },
    }

    expect(Object.values(v6SchemaStub.wallet.accounts)).toHaveLength(4)
    const v7 = migrations[7](v6SchemaStub)

    const accounts = Object.values(v7.wallet.accounts) as SignerMnemonicAccount[]
    expect(accounts).toHaveLength(1)
    expect(accounts[0]?.mnemonicId).toEqual(TEST_ADDRESSES[0])
  })

  it('migrates from v7 to v8', () => {
    const v8 = migrations[8](v7Schema)
    expect(v8.cloudBackup.backupsFound).toEqual([])
  })

  it('migrates from v8 to v9', () => {
    const TEST_ADDRESSES: [string, string, string, string] = ['0xTest', '0xTest2', '0xTest3', '0xTest4']
    const TEST_IMPORT_TIME_MS = 12345678912345

    const v8SchemaStub = {
      ...v8Schema,
      wallet: {
        ...v6Schema.wallet,
        accounts: {
          [TEST_ADDRESSES[0]]: {
            type: 'native',
            address: TEST_ADDRESSES[0],
            name: 'Test Account 1',
            pending: false,
            derivationIndex: 0,
            timeImportedMs: TEST_IMPORT_TIME_MS,
          },
          [TEST_ADDRESSES[1]]: {
            type: 'local',
            address: TEST_ADDRESSES[1],
            name: 'Test Account 2',
            pending: false,
            timeImportedMs: TEST_IMPORT_TIME_MS,
          },
        },
      },
    }

    expect(Object.values(v8SchemaStub.wallet.accounts)).toHaveLength(2)
    const v9 = migrations[9](v8SchemaStub)
    expect(Object.values(v9.wallet.accounts)).toHaveLength(1)
  })

  it('migrates from v9 to v10', () => {
    const TEST_ADDRESSES = ['0xTest', OLD_DEMO_ACCOUNT_ADDRESS, '0xTest2', '0xTest3']
    const TEST_IMPORT_TIME_MS = 12345678912345

    const accounts = TEST_ADDRESSES.reduce(
      (acc, address) => {
        acc[address] = {
          address,
          timeImportedMs: TEST_IMPORT_TIME_MS,
          type: 'native',
        } as unknown as Account

        return acc
      },
      {} as { [address: string]: Account },
    )

    const v9SchemaStub = {
      ...v9Schema,
      wallet: {
        ...v9Schema.wallet,
        accounts,
      },
    }

    expect(Object.values(v9SchemaStub.wallet.accounts)).toHaveLength(4)
    expect(Object.keys(v9SchemaStub.wallet.accounts)).toContain(OLD_DEMO_ACCOUNT_ADDRESS)

    const migratedSchema = migrations[10](v9SchemaStub)
    expect(Object.values(migratedSchema.wallet.accounts)).toHaveLength(3)
    expect(Object.keys(migratedSchema.wallet.accounts)).not.toContain(OLD_DEMO_ACCOUNT_ADDRESS)
  })

  it('migrates from v10 to v11', () => {
    const v11 = migrations[11](v10Schema)

    expect(v11.biometricSettings).toBeDefined()
    expect(v11.biometricSettings.requiredForAppAccess).toBeDefined()
    expect(v11.biometricSettings.requiredForTransactions).toBeDefined()
  })

  it('migrates from v11 to v12', () => {
    const TEST_ADDRESS = '0xTestAddress'
    const ACCOUNT_NAME = 'Test Account'
    const v11Stub = {
      ...v11Schema,
      wallet: {
        ...v11Schema.wallet,
        accounts: {
          [TEST_ADDRESS]: {
            type: 'native',
            address: TEST_ADDRESS,
            name: ACCOUNT_NAME,
            pending: false,
            derivationIndex: 0,
            timeImportedMs: 123,
          },
        },
      },
    }

    const v12 = migrations[12](v11Stub)

    expect(v12.wallet.accounts[TEST_ADDRESS].pushNotificationsEnabled).toEqual(false)
    expect(v12.wallet.accounts[TEST_ADDRESS].type).toEqual('native')
    expect(v12.wallet.accounts[TEST_ADDRESS].address).toEqual(TEST_ADDRESS)
    expect(v12.wallet.accounts[TEST_ADDRESS].name).toEqual(ACCOUNT_NAME)
  })

  it('migrates from v12 to v13', () => {
    const v13 = migrations[13](v12Schema)
    expect(v13.ens.ensForAddress).toEqual({})
  })

  it('migrates from v13 to v14', () => {
    const v13Stub = {
      ...v13Schema,
      wallet: {
        ...v13Schema.wallet,
        isBiometricAuthEnabled: true,
      },
      biometricSettings: {
        requiredForAppAccess: false,
        requiredForTransactions: false,
      },
    }

    const v14 = migrations[14](v13Stub)
    expect(v14.biometricSettings.requiredForAppAccess).toEqual(true)
    expect(v14.biometricSettings.requiredForTransactions).toEqual(true)
  })

  it('migrates from v14 to v15', () => {
    const TEST_ADDRESS = '0xTestAddress'
    const ACCOUNT_NAME = 'Test Account'
    const v14Stub = {
      ...v14Schema,
      wallet: {
        ...v14Schema.wallet,
        accounts: {
          [TEST_ADDRESS]: {
            type: 'native',
            address: TEST_ADDRESS,
            name: ACCOUNT_NAME,
            pending: false,
            derivationIndex: 0,
            timeImportedMs: 123,
          },
        },
      },
    }

    const v15 = migrations[15](v14Stub)
    const accounts = Object.values(v15.wallet.accounts)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    expect((accounts[0] as Account)?.type).toEqual(AccountType.SignerMnemonic)
  })

  it('migrates from v15 to v16', () => {
    const v15Stub = {
      ...v15Schema,
      dataApi: {},
    }

    const v16 = migrations[16](v15Stub)

    expect(v16.dataApi).toBeUndefined()
  })

  it('migrates from v16 to v17', () => {
    const TEST_ADDRESS = '0xTestAddress'
    const ACCOUNT_NAME = 'Test Account'
    const v16Stub = {
      ...v16Schema,
      wallet: {
        ...v16Schema.wallet,
        accounts: {
          [TEST_ADDRESS]: {
            type: 'native',
            address: TEST_ADDRESS,
            name: ACCOUNT_NAME,
            pending: false,
            derivationIndex: 0,
            timeImportedMs: 123,
            pushNotificationsEnabled: true,
          },
        },
      },
    }

    const v17 = migrations[17](v16Stub)

    expect(v17.wallet.accounts[TEST_ADDRESS].pushNotificationsEnabled).toEqual(false)
    expect(v17.wallet.accounts[TEST_ADDRESS].type).toEqual('native')
    expect(v17.wallet.accounts[TEST_ADDRESS].address).toEqual(TEST_ADDRESS)
    expect(v17.wallet.accounts[TEST_ADDRESS].name).toEqual(ACCOUNT_NAME)
  })

  it('migrates from v17 to v18', () => {
    const v17Stub = {
      ...v17Schema,
      ens: {},
    }
    const v18 = migrations[18](v17Stub)
    expect(v18.ens).toBeUndefined()
  })

  it('migrates from v18 to v19', () => {
    const ROPSTEN = 3 as UniverseChainId
    const RINKEBY = 4 as UniverseChainId
    const GOERLI = 5 as UniverseChainId
    const KOVAN = 42 as UniverseChainId

    const TEST_ADDRESS = '0xShadowySuperCoder'
    const txDetails0 = {
      chainId: UniverseChainId.Mainnet,
      id: '0',
      from: TEST_ADDRESS,
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

    const TEST_ADDRESS_2 = '0xKingHodler'
    const txDetails1 = {
      chainId: GOERLI,
      id: '1',
      from: TEST_ADDRESS_2,
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
      status: TransactionStatus.Success,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const transactions = {
      [TEST_ADDRESS]: {
        [UniverseChainId.Mainnet]: {
          '0': txDetails0,
        },
        [UniverseChainId.Base]: {
          '0': txDetails0,
          '1': txDetails1,
        },
        [GOERLI]: {
          '0': txDetails0,
          '1': txDetails1,
        },
        [ROPSTEN]: {
          '0': txDetails0,
          '1': txDetails1,
        },
        [RINKEBY]: {
          '0': txDetails1,
        },
        [KOVAN]: {
          '1': txDetails1,
        },
      },
      [TEST_ADDRESS_2]: {
        [UniverseChainId.ArbitrumOne]: {
          '0': txDetails0,
        },
        [UniverseChainId.Optimism]: {
          '0': txDetails0,
          '1': txDetails1,
        },
        [ROPSTEN]: {
          '0': txDetails0,
          '1': txDetails1,
        },
        [RINKEBY]: {
          '0': txDetails1,
        },
        [KOVAN]: {
          '1': txDetails1,
        },
      },
    }

    const blocks = {
      byChainId: {
        [UniverseChainId.Mainnet]: { latestBlockNumber: 123456789 },
        [UniverseChainId.Optimism]: { latestBlockNumber: 123456789 },
        [UniverseChainId.ArbitrumOne]: { latestBlockNumber: 123456789 },
        [UniverseChainId.Base]: { latestBlockNumber: 123456789 },
        [GOERLI]: { latestBlockNumber: 123456789 },
        [ROPSTEN]: { latestBlockNumber: 123456789 },
        [RINKEBY]: { latestBlockNumber: 123456789 },
        [KOVAN]: { latestBlockNumber: 123456789 },
      },
    }

    const chains = {
      byChainId: {
        [UniverseChainId.Mainnet]: { isActive: true },
        [UniverseChainId.Optimism]: { isActive: true },
        [UniverseChainId.ArbitrumOne]: { isActive: true },
        [UniverseChainId.Base]: { isActive: true },
        [GOERLI]: { isActive: true },
        [ROPSTEN]: { isActive: true },
        [RINKEBY]: { isActive: true },
        [KOVAN]: { isActive: true },
      },
    }

    const v18Stub = {
      ...v18Schema,
      transactions,
      blocks,
      chains,
    }

    const v19 = migrations[19](v18Stub)

    expect(v19.transactions[TEST_ADDRESS][UniverseChainId.Mainnet]).toBeDefined()
    expect(v19.transactions[TEST_ADDRESS][UniverseChainId.Base]).toBeDefined()
    expect(v19.transactions[TEST_ADDRESS][GOERLI]).toBeUndefined()
    expect(v19.transactions[TEST_ADDRESS][ROPSTEN]).toBeUndefined()
    expect(v19.transactions[TEST_ADDRESS][RINKEBY]).toBeUndefined()
    expect(v19.transactions[TEST_ADDRESS][KOVAN]).toBeUndefined()

    expect(v19.transactions[TEST_ADDRESS_2][UniverseChainId.ArbitrumOne]).toBeDefined()
    expect(v19.transactions[TEST_ADDRESS_2][UniverseChainId.Optimism]).toBeDefined()
    expect(v19.transactions[TEST_ADDRESS_2][ROPSTEN]).toBeUndefined()
    expect(v19.transactions[TEST_ADDRESS_2][RINKEBY]).toBeUndefined()
    expect(v19.transactions[TEST_ADDRESS_2][KOVAN]).toBeUndefined()

    expect(v19.blocks.byChainId[UniverseChainId.Mainnet]).toBeDefined()
    expect(v19.blocks.byChainId[UniverseChainId.Optimism]).toBeDefined()
    expect(v19.blocks.byChainId[UniverseChainId.ArbitrumOne]).toBeDefined()
    expect(v19.blocks.byChainId[UniverseChainId.Base]).toBeDefined()
    expect(v19.blocks.byChainId[GOERLI]).toBeUndefined()
    expect(v19.blocks.byChainId[ROPSTEN]).toBeUndefined()
    expect(v19.blocks.byChainId[RINKEBY]).toBeUndefined()
    expect(v19.blocks.byChainId[KOVAN]).toBeUndefined()

    expect(v19.chains.byChainId[UniverseChainId.Mainnet]).toBeDefined()
    expect(v19.chains.byChainId[UniverseChainId.Optimism]).toBeDefined()
    expect(v19.chains.byChainId[UniverseChainId.ArbitrumOne]).toBeDefined()
    expect(v19.chains.byChainId[UniverseChainId.Base]).toBeDefined()
    expect(v19.chains.byChainId[GOERLI]).toBeUndefined()
    expect(v19.chains.byChainId[ROPSTEN]).toBeUndefined()
    expect(v19.chains.byChainId[RINKEBY]).toBeUndefined()
    expect(v19.chains.byChainId[KOVAN]).toBeUndefined()
  })

  it('migrates from v19 to v20', () => {
    const v19Stub = {
      ...v19Schema,
      notifications: {
        ...v19Schema.notifications,
        lastTxNotificationUpdate: { 1: 122342134 },
      },
    }

    const v20 = migrations[20](v19Stub)
    expect(v20.notifications.lastTxNotificationUpdate).toEqual({})
  })

  it('migrates from v20 to v21', () => {
    const v20Stub = {
      ...v20Schema,
    }

    const v21 = migrations[21](v20Stub)
    expect(v21.experiments).toBeDefined()
  })

  it('migrates from v21 to v22', () => {
    const v21Stub = {
      ...v21Schema,
      coingeckoApi: {},
    }
    const v22 = migrations[22](v21Stub)
    expect(v22.coingeckoApi).toBeUndefined()
    expect(v22.tokens.watchedTokens).toBeUndefined()
    expect(v22.tokens.tokenPairs).toBeUndefined()
  })

  it('migrates from v22 to v23', () => {
    const v22Stub = {
      ...v22Schema,
    }
    const v23 = migrations[23](v22Stub)
    expect(v23.wallet.settings.tokensOrderBy).toBeUndefined()
    expect(v23.wallet.settings.tokensMetadataDisplayType).toBeUndefined()
  })

  it('migrates from v23 to v24', () => {
    const dummyAddress1 = '0xDumDum1'
    const dummyAddress2 = '0xDumDum2'
    const dummyAddress3 = '0xDumDum3'
    const v23Stub = {
      ...v23Schema,
      notifications: {
        ...v23Schema.notifications,
        notificationCount: { [dummyAddress1]: 5, [dummyAddress2]: 0, [dummyAddress3]: undefined },
      },
    }
    const v24 = migrations[24](v23Stub)
    expect(v24.notifications.notificationCount).toBeUndefined()
    expect(v24.notifications.notificationStatus[dummyAddress1]).toBe(true)
    expect(v24.notifications.notificationStatus[dummyAddress2]).toBe(false)
    expect(v24.notifications.notificationStatus[dummyAddress2]).toBe(false)
  })

  it('migrates from v24 to v25', () => {
    const v24Stub = {
      ...v24Schema,
    }
    const v25 = migrations[25](v24Stub)
    expect(v25.passwordLockout.passwordAttempts).toBe(0)
  })

  it('migrates from v25 to v26', () => {
    const v25Stub = {
      ...v25Schema,
    }
    const v26 = migrations[26](v25Stub)
    expect(v26.wallet.settings.showSmallBalances).toBeUndefined()
  })

  it('migrates from v26 to v27', () => {
    const v26Stub = {
      ...v26Schema,
    }
    const v27 = migrations[27](v26Stub)
    expect(v27.wallet.settings.tokensOrderBy).toBeUndefined()
  })

  it('migrates from v27 to v28', () => {
    const v27Stub = {
      ...v27Schema,
    }
    const v28 = migrations[28](v27Stub)
    expect(v28.wallet.settings.tokensMetadataDisplayType).toBeUndefined()
  })

  it('migrates from v28 to v29', () => {
    const v28Stub = {
      ...v28Schema,
    }
    const v29 = migrations[29](v28Stub)
    expect(v29.tokenLists).toBeUndefined()
    expect(v29.tokens.customTokens).toBeUndefined()
  })

  it('migrates from v29 to v30', () => {
    const oldFiatOnRampTxDetails = {
      chainId: UniverseChainId.Mainnet,
      id: '0',
      from: account.address,
      options: {
        request: {},
      },
      // expect this payload to change
      typeInfo: {
        type: TransactionType.FiatPurchaseDeprecated,
        explorerUrl: 'explorer',
        outputTokenAddress: '0xtokenAddress',
        outputCurrencyAmountFormatted: 50,
        outputCurrencyAmountPrice: 2,
        syncedWithBackend: true,
      },
      status: TransactionStatus.Pending,
      addedTime: 1487076708000,
      hash: '0x123',
    }
    const expectedTypeInfo = {
      type: TransactionType.FiatPurchaseDeprecated,
      explorerUrl: 'explorer',
      inputCurrency: undefined,
      inputCurrencyAmount: 25,
      outputCurrency: {
        type: 'crypto',
        metadata: {
          chainId: undefined,
          contractAddress: '0xtokenAddress',
        },
      },
      outputCurrencyAmount: undefined,
      syncedWithBackend: true,
    }
    const transactions = {
      [account.address]: {
        [UniverseChainId.Mainnet]: {
          '0': oldFiatOnRampTxDetails,
          '1': txDetailsConfirmed,
        },
        [UniverseChainId.Base]: {
          '0': { ...oldFiatOnRampTxDetails, status: TransactionStatus.Failed },
          '1': txDetailsConfirmed,
        },
        [UniverseChainId.ArbitrumOne]: {
          '0': { ...oldFiatOnRampTxDetails, status: TransactionStatus.Failed },
        },
      },
      '0xshadowySuperCoder': {
        [UniverseChainId.ArbitrumOne]: {
          '0': oldFiatOnRampTxDetails,
          '1': txDetailsConfirmed,
        },
        [UniverseChainId.Optimism]: {
          '0': oldFiatOnRampTxDetails,
          '1': oldFiatOnRampTxDetails,
          '2': txDetailsConfirmed,
        },
      },
      '0xdeleteMe': {
        [UniverseChainId.Mainnet]: {
          '0': { ...oldFiatOnRampTxDetails, status: TransactionStatus.Failed },
        },
      },
    }
    const v29Stub = { ...v29Schema, transactions }

    const v30 = migrations[30](v29Stub)

    // expect fiat onramp txdetails to change
    expect(v30.transactions[account.address][UniverseChainId.Mainnet]['0'].typeInfo).toEqual(expectedTypeInfo)
    expect(v30.transactions[account.address][UniverseChainId.Base]['0']).toBeUndefined()
    expect(v30.transactions[account.address][UniverseChainId.ArbitrumOne]).toBeUndefined() // does not create an object for chain
    expect(v30.transactions['0xshadowySuperCoder'][UniverseChainId.ArbitrumOne]['0'].typeInfo).toEqual(expectedTypeInfo)
    expect(v30.transactions['0xshadowySuperCoder'][UniverseChainId.Optimism]['0'].typeInfo).toEqual(expectedTypeInfo)
    expect(v30.transactions['0xshadowySuperCoder'][UniverseChainId.Optimism]['1'].typeInfo).toEqual(expectedTypeInfo)
    expect(v30.transactions['0xdeleteMe']).toBe(undefined)
    // expect non-for txDetails to not change
    expect(v30.transactions[account.address][UniverseChainId.Mainnet]['1']).toEqual(txDetailsConfirmed)
    expect(v30.transactions[account.address][UniverseChainId.Base]['1']).toEqual(txDetailsConfirmed)
    expect(v30.transactions['0xshadowySuperCoder'][UniverseChainId.ArbitrumOne]['1']).toEqual(txDetailsConfirmed)
    expect(v30.transactions['0xshadowySuperCoder'][UniverseChainId.Optimism]['2']).toEqual(txDetailsConfirmed)
  })

  it('migrates from v31 to 32', () => {
    const v31Stub = { ...v31Schema, ENS: 'defined' }

    const v32 = migrations[32](v31Stub)

    expect(v32.ENS).toBe(undefined)
  })

  it('migrates from v32 to 33', () => {
    const v32Stub = { ...v32Schema }

    const v33 = migrations[33](v32Stub)

    expect(v33.wallet.replaceAccountOptions.isReplacingAccount).toBe(false)
    expect(v33.wallet.replaceAccountOptions.skipToSeedPhrase).toBe(false)
  })

  it('migrates from v33 to 34', () => {
    const v33Stub = { ...v33Schema }

    const v34 = migrations[34](v33Stub)

    expect(v34.telemetry.lastBalancesReport).toBe(0)
  })

  it('migrates from v34 to 35', () => {
    const v34Stub = { ...v34Schema }

    const v35 = migrations[35](v34Stub)

    expect(v35.appearanceSettings.selectedAppearanceSettings).toBe('system')
  })

  it('migrates from v35 to 36', () => {
    const v35Stub = { ...v35Schema }

    const v36 = migrations[36](v35Stub)

    expect(v36.favorites.hiddenNfts).toEqual({})
  })

  it('migrates from v36 to 37', () => {
    const id1 = '123'
    const id2 = '456'
    const id3 = '789'
    const transactions = {
      [account.address]: {
        [UniverseChainId.Mainnet]: {
          [id1]: {
            ...fiatOnRampTxDetailsFailed,
            typeInfo: {
              ...fiatOnRampTxDetailsFailed.typeInfo,
              id: undefined,
            },
          },
          [id2]: {
            ...fiatOnRampTxDetailsFailed,
            typeInfo: {
              ...fiatOnRampTxDetailsFailed.typeInfo,
              id: undefined,
              explorerUrl: undefined,
            },
          },
          [id3]: txDetailsConfirmed,
        },
      },
    }

    const v36Stub = { ...v36Schema, transactions }

    expect(v36Stub.transactions[account.address]?.[UniverseChainId.Mainnet][id1].typeInfo.id).toBeUndefined()
    expect(v36Stub.transactions[account.address]?.[UniverseChainId.Mainnet][id2].typeInfo.id).toBeUndefined()

    const v37 = migrations[37](v36Stub)

    expect(v37.transactions[account.address]?.[UniverseChainId.Mainnet][id1].typeInfo.id).toEqual(
      fiatOnRampTxDetailsFailed.typeInfo.id,
    )
    expect(v36Stub.transactions[account.address]?.[UniverseChainId.Mainnet][id2].typeInfo.id).toBeUndefined()
    expect(v36Stub.transactions[account.address]?.[UniverseChainId.Mainnet][id3]).toEqual(txDetailsConfirmed)
  })

  it('migrates from v37 to 38', () => {
    const v37Stub = { ...v37Schema }
    const v38 = migrations[38](v37Stub)
    expect(v38.wallet.replaceAccountOptions).toBeUndefined()
  })

  it('migrates from v38 to 39', () => {
    const v38Stub = { ...v38Schema }
    expect(v38Stub.experiments).toBeDefined()
    const v39 = migrations[39](v38Stub)
    expect(v39.experiments).toBeUndefined()
  })

  it('migrates from v39 to 40', () => {
    const v39Stub = { ...v39Schema }

    const v40 = migrations[40](v39Stub)

    // walletConnect slice still exists but should not be persisted
    expect(v40.walletConnect).toBeUndefined()
  })

  it('migrates from v40 to 41', () => {
    const v40Stub = { ...v40Schema }

    const v41 = migrations[41](v40Stub)

    expect(v41.telemetry.lastBalancesReportValue).toBe(0)
  })

  it('migrates from v41 to 42', () => {
    const v41Stub = { ...v41Schema }

    const v42 = migrations[42](v41Stub)

    expect(v42.wallet.flashbotsenabled).toBeUndefined()
  })

  it('migrates from v42 to 43', () => {
    const v42Stub = { ...v42Schema }

    v42Stub.favorites.hiddenNfts = {
      '0xAFa9bAb987E3D7bcD40EB510838aEC663C8b7264': {
        'nftItem.0xb96e881BD4Cd7BCCc8CB47d3aa0e254a72d2F074.3971': true, // checksummed 1
        'nftItem.0xb96e881bd4cd7bccc8cb47d3aa0e254a72d2f074.3971': true, // not checksummed 1
        'nftItem.0x25E503331e69EFCBbc50d2a4D661900B23D47662.2': true, // checksummed 2
        'nftItem.0xe94abea3932576ff957a0b92190d0191aeb1a782.2': true, // not checksummed 3
      },
    }

    const v43 = migrations[43](v42Stub)

    // expect(v43.favorites.hiddenNfts).toEqual(undefined)
    // all checksummed keys should be converted to not checksummed ones and duplicates should be removed
    expect(v43.favorites.nftsData).toEqual({
      '0xAFa9bAb987E3D7bcD40EB510838aEC663C8b7264': {
        'nftItem.0xb96e881bd4cd7bccc8cb47d3aa0e254a72d2f074.3971': { isHidden: true }, // not checksummed 1
        'nftItem.0x25e503331e69efcbbc50d2a4d661900b23d47662.2': { isHidden: true }, // not checksummed 2
        'nftItem.0xe94abea3932576ff957a0b92190d0191aeb1a782.2': { isHidden: true }, // not checksummed 3
      },
    })
  })

  it('migrates from v43 to v44', () => {
    const v43Stub = { ...v43Schema }

    v43Stub.providers = { isInitialized: true }

    const v44 = migrations[44](v43Stub)

    expect(v44.providers).toBeUndefined()
  })

  it('migrates from v44 to 45', () => {
    const v44Stub = { ...v44Schema }

    const v45 = migrations[45](v44Stub)

    expect(v45.favorites.tokensVisibility).toEqual({})
  })

  it('migrates from v45 to 46', () => {
    const v45Stub = { ...v45Schema }
    const v46 = migrations[46](v45Stub)

    expect(v46.ENS).toBeUndefined()
    expect(v46.ens).toBeUndefined()
    expect(v46.gasApi).toBeUndefined()
    expect(v46.onChainBalanceApi).toBeUndefined()
    expect(v46.routingApi).toBeUndefined()
    expect(v46.trmApi).toBeUndefined()
  })

  it('migrates from v46 to 47', () => {
    const v46Stub = { ...v46Schema }
    const v47 = migrations[47](v46Stub)

    expect(v47.chains.byChainId).toStrictEqual({
      '1': { isActive: true },
      '10': { isActive: true },
      '56': { isActive: true },
      '137': { isActive: true },
      '8453': { isActive: true },
      '42161': { isActive: true },
    })
  })

  it('migrates from v47 to 48', () => {
    const v47Stub = { ...v47Schema }
    const v48 = migrations[48](v47Stub)

    expect(v48.tweaks).toEqual({})
  })

  it('migrates from v48 to 49', () => {
    const v48Stub = { ...v48Schema }
    const v49 = migrations[49](v48Stub)

    expect(v49.wallet.settings.swapProtection).toEqual(SwapProtectionSetting.On)
  })

  it('migrates from v49 to 50', () => {
    const v449Stub = { ...v49Schema }
    const v50 = migrations[50](v449Stub)

    expect(v50.chains).toBeUndefined()
  })

  it('migrates from v50 to 51', () => {
    const v50Stub = { ...v50Schema }
    const v51 = migrations[51](v50Stub)

    expect(v51.languageSettings).not.toBeUndefined()
  })

  it('migrates from v51 to 52', () => {
    const v51Stub = { ...v51Schema }
    const v52 = migrations[52](v51Stub)

    expect(v52.fiatCurrencySettings).not.toBeUndefined()
  })

  it('migrates from v52 to 53', () => {
    const v52Stub = { ...v52Schema }
    const v53 = migrations[53](v52Stub)

    expect(v53.languageSettings).not.toBeUndefined()
  })

  it('migrates from v53 to 54', () => {
    const v53Stub = { ...v53Schema }
    const v54 = migrations[54](v53Stub)

    expect(v54.telemetry.walletIsFunded).toBe(false)
  })

  it('migrates from v54 to 55', () => {
    const v54Stub = { ...v54Schema }
    const v55 = migrations[55](v54Stub)

    expect(v55.behaviorHistory.hasViewedReviewScreen).toBe(false)
  })

  it('migrates from v55 to 56', () => {
    const v55Stub = { ...v55Schema }
    const v56 = migrations[56](v55Stub)

    expect(v56.telemetry.allowAnalytics).toBe(true)
    expect(v56.telemetry.lastHeartbeat).toBe(0)
  })

  it('migrates from v56 to 57', () => {
    const v56Stub = {
      ...v56Schema,
      wallet: {
        ...v56Schema.wallet,
        accounts: [
          {
            type: AccountType.Readonly,
            address: '0x',
            name: 'Test Account 1',
            pending: false,
            hideSpamTokens: true,
          },
        ],
      },
    }
    const v57 = migrations[57](v56Stub)
    expect(v57.wallet.settings.hideSmallBalances).toBe(true)
    expect(v57.wallet.settings.hideSpamTokens).toBe(true)
    expect(v57.wallet.accounts[0].showSpamTokens).toBeUndefined()
    expect(v57.wallet.accounts[0].showSmallBalances).toBeUndefined()
  })

  it('migrates from v57 to 58', () => {
    const v57Stub = { ...v57Schema }
    const v58 = migrations[58](v57Stub)

    expect(v58.behaviorHistory.hasSkippedUnitagPrompt).toBe(false)
  })

  it('migrates from v58 to 59', () => {
    const v58Stub = { ...v58Schema }
    const v59 = migrations[59](v58Stub)

    expect(v59.behaviorHistory.hasCompletedUnitagsIntroModal).toBe(false)
  })

  it('migrates from v59 to 60', () => {
    const v59Stub = { ...v59Schema }
    const v60 = migrations[60](v59Stub)

    expect(v60.behaviorHistory.hasViewedUniconV2IntroModal).toBe(false)
  })

  it('migrates from v60 to 61', () => {
    const v60Stub = { ...v60Schema }
    const address1 = '0x123'
    const address2 = '0x456'
    const nftKey1 = '0xNFTKey1'
    const nftKey2 = '0xNFTKey2'
    const nftKey3 = '0xNFTKey3'
    const nftKey4 = '0xNFTKey4'

    const currency1ToVisibility = { '0xCurrency1': { isVisible: true } }
    const currency2ToVisibility = { '0xCurrency2': { isVisible: false } }
    const currency3ToVisibility = { '0xCurrency3': { isVisible: false } }
    const nft1ToVisibility = { [nftKey1]: { isSpamIgnored: true } }
    const nft2ToVisibility = { [nftKey2]: { isHidden: true } }
    const nft3ToVisibility = { [nftKey3]: { isSpamIgnored: false, isHidden: false } }
    const nft4ToVisibility = { [nftKey4]: { isSpamIgnored: false, isHidden: true } }

    v60Stub.favorites = {
      ...v60Stub.favorites,
      tokensVisibility: {
        [address1]: { ...currency1ToVisibility, ...currency2ToVisibility },
        [address2]: { ...currency2ToVisibility, ...currency3ToVisibility },
      },
      nftsData: {
        [address1]: { ...nft1ToVisibility, ...nft2ToVisibility, ...nft3ToVisibility },
        [address2]: { ...nft3ToVisibility, ...nft4ToVisibility },
      },
    }

    const v61 = migrations[61](v60Stub)

    expect(v61.favorites.nftsData).toBeUndefined()
    expect(v61.favorites.tokensVisibility).toMatchObject({
      ...currency1ToVisibility,
      ...currency2ToVisibility,
      ...currency3ToVisibility,
    })
    expect(v61.favorites.nftsVisibility).toMatchObject({
      [nftKey1]: { isVisible: true },
      [nftKey2]: { isVisible: false },
      [nftKey3]: { isVisible: true },
      [nftKey4]: { isVisible: false },
    })
  })

  it('migrates from v61 to 62', () => {
    const v61Stub = { ...v61Schema }
    const v62 = migrations[62](v61Stub)

    // Removed in schema 69
    expect(v62.behaviorHistory.extensionOnboardingState).toBe('Undefined')
  })

  it('migrates from v62 to 63', () => {
    const v62Stub = { ...v62Schema }
    const v63 = migrations[63](v62Stub)

    expect(v63.wallet.isUnlocked).toBe(undefined)
  })

  it('migrates from v63 to 64', () => {
    const v63Stub = { ...v63Schema }
    const v64 = migrations[64](v63Stub)

    expect(v64.behaviorHistory.hasViewedUniconV2IntroModal).toBe(undefined)
  })

  it('migrates from v64 to 65', () => {
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

    const v64Stub = { ...v64Schema, transactions }

    const v65 = migrations[65](v64Stub)

    expect(v65.transactions[TEST_ADDRESS][UniverseChainId.Mainnet]['0'].routing).toBe('CLASSIC')
    expect(v65.transactions[TEST_ADDRESS][UniverseChainId.Optimism]['1'].routing).toBe('CLASSIC')
  })
  it('migrates from v65 to v66', () => {
    const v66 = migrations[66]
    testActivatePendingAccounts(v66, v65Schema)
  })

  it('migrates from v66 to v67', () => {
    const v66Stub = { ...v66Schema }
    const v67 = migrations[67](v66Stub)

    // Removed in migration 69
    expect(v67.behaviorHistory.extensionOnboardingState).toBe('Undefined')
  })

  it('migrates from v67 to v68', () => {
    const v67Stub = { ...v67Schema }
    const v68 = migrations[68](v67Stub)

    expect(v68.behaviorHistory.extensionBetaFeedbackState).toBe(undefined)
  })

  it('migrates from v68 to v69', async () => {
    const v68Stub = { ...v68Schema }
    const v69 = await migrations[69](v68Stub)
    expect(v69.behaviorHistory.extensionBetaFeedbackState).toBe(undefined)
  })

  it('migrates from v69 to v70', async () => {
    const v69Stub = { ...v69Schema }
    v69Stub.favorites.watchedAddresses = [HAYDEN_ETH_ADDRESS] as never
    const v70 = await migrations[70](v69Stub)
    expect(v70.favorites.watchedAddresses).toEqual([])
  })

  it('migrates from v70 to v71', async () => {
    testAddedHapticSetting(migrations[71], v70Schema)
  })

  it('migrates from v71 to v72', () => {
    const v71Stub = { ...v71Schema }
    const v72 = migrations[72](v71Stub)

    expect(v72.behaviorHistory.hasViewedWelcomeWalletCard).toBe(false)
    expect(v72.behaviorHistory.hasUsedExplore).toBe(false)
  })

  it('migrates from v72 to v73', async () => {
    testMovedUserSettings(migrations[73], v72Schema)
  })

  it('migrates from v73 to v74', () => {
    const oldFiatOnRampTxDetails = {
      chainId: UniverseChainId.Mainnet,
      id: '0',
      from: account.address,
      options: {
        request: {},
      },
      typeInfo: {
        type: TransactionType.FiatPurchaseDeprecated,
        explorerUrl: 'explorer',
        inputCurrencyAmount: 25,
        outputSymbol: 'USDC',
      },
      status: TransactionStatus.Pending,
      addedTime: 1487076708000,
      hash: '0x123',
    }
    const transactions = {
      [account.address]: {
        [UniverseChainId.Mainnet]: {
          '0': oldFiatOnRampTxDetails,
          '1': txDetailsConfirmed,
        },
        [UniverseChainId.Optimism]: {
          '0': oldFiatOnRampTxDetails,
          '1': {
            ...oldFiatOnRampTxDetails,
            typeInfo: {
              ...oldFiatOnRampTxDetails.typeInfo,
              type: TransactionType.Send,
            },
          },
          '2': {
            ...oldFiatOnRampTxDetails,
            typeInfo: {
              ...oldFiatOnRampTxDetails.typeInfo,
              type: TransactionType.Receive,
            },
          },
          '3': txDetailsConfirmed,
        },
      },
    }
    const v73Stub = { ...v73Schema, transactions }

    const v74 = migrations[74](v73Stub)

    expect(v74.transactions[account.address][UniverseChainId.Mainnet]['0']).toBe(undefined)
    expect(v74.transactions[account.address][UniverseChainId.Mainnet]['1']).toEqual(txDetailsConfirmed)

    expect(v74.transactions[account.address][UniverseChainId.Optimism]['0']).toBe(undefined)
    expect(v74.transactions[account.address][UniverseChainId.Optimism]['1'].typeInfo).toEqual({
      ...oldFiatOnRampTxDetails.typeInfo,
      type: TransactionType.Send,
    })
    expect(v74.transactions[account.address][UniverseChainId.Optimism]['2'].typeInfo).toEqual({
      ...oldFiatOnRampTxDetails.typeInfo,
      type: TransactionType.Receive,
    })
    expect(v74.transactions[account.address][UniverseChainId.Optimism]['3']).toEqual(txDetailsConfirmed)
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
    // v82 didn't have a new schema
    const v82Stub = { ...v82Schema }
    const v83 = migrations[83](v82Stub)

    expect(v83.pushNotifications.generalUpdatesEnabled).toBe(false)
    expect(v83.pushNotifications.priceAlertsEnabled).toBe(false)
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
    /** test migration on uwulink transaction */
    const stateWithUwulinkTransaction = {
      transactions: {
        testAddress: {
          testChainId: {
            testTxnId: {
              typeInfo: {
                dappRequestInfo: {
                  name: 'testDapp',
                },
                externalDappInfo: {
                  source: 'uwulink',
                },
              },
            },
          },
        },
      },
    }

    const v86Stub = { ...v86Schema, ...stateWithUwulinkTransaction }
    const v87 = migrations[87](v86Stub)

    expect(v87.transactions).toBeDefined()
    expect(v87.transactions.testAddress.testChainId.testTxnId.typeInfo).toEqual({
      dappRequestInfo: {
        name: 'testDapp',
      },
      externalDappInfo: {
        requestType: DappRequestType.UwULink,
      },
    })

    /** test migration on walletconnect transaction */
    const stateWithWalletConnectTransaction = {
      transactions: {
        testAddress: {
          testChainId: {
            testTxnId: {
              typeInfo: {
                type: TransactionType.WCConfirm,
                dapp: {
                  name: 'testDapp',
                },
                externalDappInfo: {
                  source: 'walletconnect',
                },
              },
            },
          },
        },
      },
    }

    const v86StubWalletConnect = { ...v86Schema, ...stateWithWalletConnectTransaction }
    const v87WalletConnect = migrations[87](v86StubWalletConnect)

    expect(v87WalletConnect.transactions).toBeDefined()
    expect(v87WalletConnect.transactions.testAddress.testChainId.testTxnId.typeInfo).toEqual({
      type: TransactionType.WCConfirm,
      dappRequestInfo: {
        name: 'testDapp',
      },
      externalDappInfo: {
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
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
    const androidCloudBackupEmail = 'test@test.com'

    const { cloudBackup: _oldCloudBackup, ...v91WithoutCloudBackup } = v91Schema

    const v91WithoutCloudBackupSlice = {
      ...v91WithoutCloudBackup,
      wallet: {
        ...v91Schema.wallet,
        activeAccountAddress: '0xabc',
      },
    }

    const v91WithCloudBackup = {
      ...v91WithoutCloudBackupSlice,
      cloudBackup: {
        backupsFound: [{ mnemonicId: '0xabc', email: androidCloudBackupEmail }],
      },
      wallet: {
        ...v91Schema.wallet,
        activeAccountAddress: '0xabc',
      },
    }

    const v91WithDifferentActiveAccountAddress = {
      ...v91WithoutCloudBackupSlice,
      cloudBackup: {
        backupsFound: [{ mnemonicId: '0xdef', email: androidCloudBackupEmail }],
      },
      wallet: {
        ...v91Schema.wallet,
        activeAccountAddress: '0xabc',
      },
    }

    const v92 = migrations[92](v91WithCloudBackup)
    expect(v92.cloudBackup).toBeUndefined()
    expect(v92.wallet.androidCloudBackupEmail).toBe(androidCloudBackupEmail)

    const v92WithoutCloudBackup = migrations[92](v91WithoutCloudBackupSlice)
    expect(v92WithoutCloudBackup.cloudBackup).toBeUndefined()
    expect(v92WithoutCloudBackup.wallet.androidCloudBackupEmail).toBe(undefined)

    const v92WithDifferentActiveAccountAddress = migrations[92](v91WithDifferentActiveAccountAddress)
    expect(v92WithDifferentActiveAccountAddress.cloudBackup).toBeUndefined()
    expect(v92WithDifferentActiveAccountAddress.wallet.androidCloudBackupEmail).toBe(androidCloudBackupEmail)
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
