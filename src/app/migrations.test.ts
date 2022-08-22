import { BigNumber } from 'ethers'
import mockdate from 'mockdate'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import {
  getSchema,
  initialSchema,
  v10Schema,
  v11Schema,
  v12Schema,
  v13Schema,
  v14Schema,
  v1Schema,
  v2Schema,
  v3Schema,
  v4Schema,
  v5Schema,
  v6Schema,
  v7Schema,
  v8Schema,
  v9Schema,
} from 'src/app/schema'
import { persistConfig } from 'src/app/store'
import { WalletConnectModalState } from 'src/components/WalletConnect/constants'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { initialBiometricsSettingsState } from 'src/features/biometrics/slice'
import { initialBlockState } from 'src/features/blocks/blocksSlice'
import { initialChainsState } from 'src/features/chains/chainsSlice'
import { initialCloudBackupState } from 'src/features/CloudBackup/cloudBackupSlice'
import { initialEnsState } from 'src/features/ens/ensSlice'
import { initialSearchHistoryState } from 'src/features/explore/searchHistorySlice'
import { initialFavoritesState } from 'src/features/favorites/slice'
import { initialModalState } from 'src/features/modals/modalSlice'
import { initialNotificationsState } from 'src/features/notifications/notificationSlice'
import { initialProvidersState } from 'src/features/providers/providerSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { initialTokenListsState } from 'src/features/tokenLists/reducer'
import { initialTokensState } from 'src/features/tokens/tokensSlice'
import { initialTransactionsState } from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { initialWalletState } from 'src/features/wallet/walletSlice'
import { initialWalletConnectState } from 'src/features/walletConnect/walletConnectSlice'

const getAllKeysOfNestedObject = (obj: any, prefix = ''): string[] => {
  const keys = Object.keys(obj)
  if (!keys.length && prefix !== '') return [prefix.slice(0, -1)]
  return keys.reduce<string[]>((res, el) => {
    if (Array.isArray(obj[el])) return [...res]

    if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getAllKeysOfNestedObject(obj[el], prefix + el + '.')]
    }

    return [...res, prefix + el]
  }, [])
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
      biometricSettings: initialBiometricsSettingsState,
      blocks: initialBlockState,
      chains: initialChainsState,
      cloudBackup: initialCloudBackupState,
      favorites: initialFavoritesState,
      modals: initialModalState,
      notifications: initialNotificationsState,
      providers: initialProvidersState,
      saga: {},
      searchHistory: initialSearchHistoryState,
      tokenLists: initialTokenListsState,
      tokens: initialTokensState,
      transactions: initialTransactionsState,
      wallet: initialWalletState,
      walletConnect: initialWalletConnectState,
      ens: initialEnsState,
      _persist: {
        version: persistConfig.version,
        rehydrated: true,
      },
    }

    const migratedSchemaKeys = new Set(getAllKeysOfNestedObject(migratedSchema as any))
    const latestSchemaKeys = new Set(getAllKeysOfNestedObject(getSchema()))
    const initialStateKeys = new Set(getAllKeysOfNestedObject(initialState))

    for (const key of initialStateKeys) {
      if (latestSchemaKeys.has(key)) latestSchemaKeys.delete(key)
      if (migratedSchemaKeys.has(key)) migratedSchemaKeys.delete(key)
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
    const migratedSchema = await migrate(emptyStub, persistConfig.version)
    expect(typeof migratedSchema).toBe('object')
  })

  it('migrates from initialSchema to v0Schema', () => {
    const txDetails0: TransactionDetails = {
      chainId: ChainId.Mainnet,
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
        spender: SWAP_ROUTER_ADDRESSES[ChainId.Mainnet],
      },
      status: TransactionStatus.Pending,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const txDetails1: TransactionDetails = {
      chainId: ChainId.Rinkeby,
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
        spender: SWAP_ROUTER_ADDRESSES[ChainId.Rinkeby],
      },
      status: TransactionStatus.Success,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const initialSchemaStub = {
      ...initialSchema,
      transactions: {
        byChainId: {
          [ChainId.Mainnet]: {
            '0': txDetails0,
          },
          [ChainId.Rinkeby]: {
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
    expect(newSchema.transactions[ChainId.Mainnet]).toBeUndefined()
    expect(newSchema.transactions.lastTxHistoryUpdate).toBeUndefined()

    expect(newSchema.transactions['0xShadowySuperCoder'][ChainId.Mainnet]['0'].status).toEqual(
      TransactionStatus.Pending
    )
    expect(newSchema.transactions['0xKingHodler'][ChainId.Mainnet]).toBeUndefined()
    expect(newSchema.transactions['0xKingHodler'][ChainId.Rinkeby]['0']).toBeUndefined()
    expect(newSchema.transactions['0xKingHodler'][ChainId.Rinkeby]['1'].from).toEqual(
      '0xKingHodler'
    )

    expect(newSchema.notifications.lastTxNotificationUpdate).toBeDefined()
    expect(
      newSchema.notifications.lastTxNotificationUpdate['0xShadowySuperCoder'][ChainId.Mainnet]
    ).toEqual(12345678912345)
  })

  it('migrates from v0 to v1', () => {
    const initialSchemaStub = {
      ...initialSchema,
      walletConnect: {
        ...initialSchema.wallet,
        modalState: WalletConnectModalState.ScanQr,
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
    const TEST_ADDRESSES = ['0xTest', '0xTest2', '0xTest3', '0xTest4']
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

    const accounts = Object.values(v7.wallet.accounts)
    expect(accounts).toHaveLength(1)
    expect((accounts[0] as any)?.mnemonicId).toEqual(TEST_ADDRESSES[0])
  })

  it('migrates from v7 to v8', () => {
    const v8 = migrations[8](v7Schema)
    expect(v8.cloudBackup.backupsFound).toEqual([])
  })

  it('migrates from v8 to v9', () => {
    const TEST_ADDRESSES = ['0xTest', '0xTest2', '0xTest3', '0xTest4']
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
    const DEMO_ACCOUNT_ADDRESS = '0xE1d494bC8690b1EF2F0A13B6672C4F2EE5c2D2B7'
    const TEST_ADDRESSES = ['0xTest', DEMO_ACCOUNT_ADDRESS, '0xTest2', '0xTest3']
    const TEST_IMPORT_TIME_MS = 12345678912345

    const accounts = TEST_ADDRESSES.reduce((acc, address) => {
      acc[address] = {
        address,
        timeImportedMs: TEST_IMPORT_TIME_MS,
        type: 'native',
      } as unknown as Account

      return acc
    }, {} as { [address: string]: Account })

    const v9SchemaStub = {
      ...v9Schema,
      wallet: {
        ...v9Schema.wallet,
        accounts,
      },
    }

    expect(Object.values(v9SchemaStub.wallet.accounts)).toHaveLength(4)
    expect(Object.keys(v9SchemaStub.wallet.accounts)).toContain(DEMO_ACCOUNT_ADDRESS)

    const migratedSchema = migrations[10](v9SchemaStub)
    expect(Object.values(migratedSchema.wallet.accounts)).toHaveLength(3)
    expect(Object.keys(migratedSchema.wallet.accounts)).not.toContain(DEMO_ACCOUNT_ADDRESS)
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
    expect((accounts[0] as Account)?.type).toEqual(AccountType.SignerMnemonic)
  })
})
