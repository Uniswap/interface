/**
 * Test helpers for testing migrations run in sequence.
 *
 * Called by migrations.test.ts to verify migrations work correctly with realistic
 * data that has passed through all prior migrations in the chain.
 *
 * For unit tests of individual migrations, see mobileMigrations.test.ts.
 */
// biome-ignore-all lint/suspicious/noExplicitAny: Migration test functions need flexible any types
/* eslint-disable max-lines */
/* eslint-disable max-params */
import { BigNumber } from '@ethersproject/bignumber'
import mockdate from 'mockdate'
import { OLD_DEMO_ACCOUNT_ADDRESS } from 'src/app/mobileMigrations'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { DappRequestType } from 'uniswap/src/types/walletConnect'
import { type Account, type SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

export function testRestructureTransactionsAndNotifications(migration: (state: any) => any, prevSchema: any): void {
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
    ...prevSchema,
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

  const newSchema = migration(initialSchemaStub)
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
}

export function testRemoveWalletConnectModalState(migration: (state: any) => any, prevSchema: any): void {
  const v0Stub = {
    ...prevSchema,
    walletConnect: {
      ...prevSchema.wallet,
      modalState: ScannerModalState.ScanQr,
    },
  }

  const v1 = migration(v0Stub)
  expect(v1.walletConnect.modalState).toEqual(undefined)
}

export function testRenameFollowedAddressesToWatchedAddresses(migration: (state: any) => any, prevSchema: any): void {
  const TEST_ADDRESSES = ['0xTest']

  const v1SchemaStub = {
    ...prevSchema,
    favorites: {
      ...prevSchema.favorites,
      followedAddresses: TEST_ADDRESSES,
    },
  }

  const v2 = migration(v1SchemaStub)

  expect(v2.favorites.watchedAddresses).toEqual(TEST_ADDRESSES)
  expect(v2.favorites.followedAddresses).toBeUndefined()
}

export function testAddSearchHistory(migration: (state: any) => any, prevSchema: any): void {
  const v3 = migration(prevSchema)
  expect(v3.searchHistory.results).toEqual([])
}

export function testAddTimeImportedAndDerivationIndex(migration: (state: any) => any, prevSchema: any): void {
  const TEST_ADDRESSES = ['0xTest', '0xTest2', '0xTest3', '0xTest4']
  const TEST_IMPORT_TIME_MS = 12345678912345

  const v3SchemaStub = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
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

  const v4 = migration(v3SchemaStub)
  expect(v4.wallet.accounts[0].timeImportedMs).toEqual(TEST_IMPORT_TIME_MS)
  expect(v4.wallet.accounts[2].derivationIndex).toBeDefined()
}

export function testAddModalsState(migration: (state: any) => any, prevSchema: any): void {
  const v5 = migration(prevSchema)

  expect(prevSchema.balances).toBeDefined()
  expect(v5.balances).toBeUndefined()

  expect(v5.modals[ModalName.Swap].isOpen).toEqual(false)
  expect(v5.modals[ModalName.Send].isOpen).toEqual(false)
}

export function testAddWalletConnectPendingSessionAndSettings(migration: (state: any) => any, prevSchema: any): void {
  const v6 = migration(prevSchema)

  expect(v6.walletConnect.pendingSession).toBe(null)

  expect(typeof v6.wallet.settings).toBe('object')

  expect(prevSchema.wallet.bluetooth).toBeDefined()
  expect(v6.wallet.bluetooth).toBeUndefined()
}

export function testRemoveNonZeroDerivationIndexAccounts(migration: (state: any) => any, prevSchema: any): void {
  const TEST_ADDRESSES: [string, string, string, string] = ['0xTest', '0xTest2', '0xTest3', '0xTest4']
  const TEST_IMPORT_TIME_MS = 12345678912345

  const v6SchemaStub = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
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
  const v7 = migration(v6SchemaStub)

  const accounts = Object.values(v7.wallet.accounts) as SignerMnemonicAccount[]
  expect(accounts).toHaveLength(1)
  expect(accounts[0]?.mnemonicId).toEqual(TEST_ADDRESSES[0])
}

export function testAddCloudBackup(migration: (state: any) => any, prevSchema: any): void {
  const v8 = migration(prevSchema)
  expect(v8.cloudBackup.backupsFound).toEqual([])
}

export function testRemoveLocalTypeAccounts(migration: (state: any) => any, prevSchema: any): void {
  const TEST_ADDRESSES: [string, string] = ['0xTest', '0xTest2']
  const TEST_IMPORT_TIME_MS = 12345678912345

  const v8SchemaStub = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
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
  const v9 = migration(v8SchemaStub)
  expect(Object.values(v9.wallet.accounts)).toHaveLength(1)
}

export function testRemoveDemoAccount(migration: (state: any) => any, prevSchema: any): void {
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
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      accounts,
    },
  }

  expect(Object.values(v9SchemaStub.wallet.accounts)).toHaveLength(4)
  expect(Object.keys(v9SchemaStub.wallet.accounts)).toContain(OLD_DEMO_ACCOUNT_ADDRESS)

  const migratedSchema = migration(v9SchemaStub)
  expect(Object.values(migratedSchema.wallet.accounts)).toHaveLength(3)
  expect(Object.keys(migratedSchema.wallet.accounts)).not.toContain(OLD_DEMO_ACCOUNT_ADDRESS)
}

export function testAddBiometricSettings(migration: (state: any) => any, prevSchema: any): void {
  const v11 = migration(prevSchema)

  expect(v11.biometricSettings).toBeDefined()
  expect(v11.biometricSettings.requiredForAppAccess).toBeDefined()
  expect(v11.biometricSettings.requiredForTransactions).toBeDefined()
}

export function testAddPushNotificationsEnabledToAccounts(migration: (state: any) => any, prevSchema: any): void {
  const TEST_ADDRESS = '0xTestAddress'
  const ACCOUNT_NAME = 'Test Account'
  const v11Stub = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
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

  const v12 = migration(v11Stub)

  expect(v12.wallet.accounts[TEST_ADDRESS].pushNotificationsEnabled).toEqual(false)
  expect(v12.wallet.accounts[TEST_ADDRESS].type).toEqual('native')
  expect(v12.wallet.accounts[TEST_ADDRESS].address).toEqual(TEST_ADDRESS)
  expect(v12.wallet.accounts[TEST_ADDRESS].name).toEqual(ACCOUNT_NAME)
}

export function testAddEnsState(migration: (state: any) => any, prevSchema: any): void {
  const v13 = migration(prevSchema)
  expect(v13.ens.ensForAddress).toEqual({})
}

export function testMigrateBiometricSettings(migration: (state: any) => any, prevSchema: any): void {
  const v13Stub = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      isBiometricAuthEnabled: true,
    },
    biometricSettings: {
      requiredForAppAccess: false,
      requiredForTransactions: false,
    },
  }

  const v14 = migration(v13Stub)
  expect(v14.biometricSettings.requiredForAppAccess).toEqual(true)
  expect(v14.biometricSettings.requiredForTransactions).toEqual(true)
}

export function testChangeNativeTypeToSignerMnemonic(migration: (state: any) => any, prevSchema: any): void {
  const TEST_ADDRESS = '0xTestAddress'
  const ACCOUNT_NAME = 'Test Account'
  const v14Stub = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
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

  const v15 = migration(v14Stub)
  const accounts = Object.values(v15.wallet.accounts)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  expect((accounts[0] as Account)?.type).toEqual(AccountType.SignerMnemonic)
}

export function testRemoveDataApi(migration: (state: any) => any, prevSchema: any): void {
  const v15Stub = {
    ...prevSchema,
    dataApi: {},
  }

  const v16 = migration(v15Stub)

  expect(v16.dataApi).toBeUndefined()
}

export function testResetPushNotificationsEnabled(migration: (state: any) => any, prevSchema: any): void {
  const TEST_ADDRESS = '0xTestAddress'
  const ACCOUNT_NAME = 'Test Account'
  const v16Stub = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
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

  const v17 = migration(v16Stub)

  expect(v17.wallet.accounts[TEST_ADDRESS].pushNotificationsEnabled).toEqual(false)
  expect(v17.wallet.accounts[TEST_ADDRESS].type).toEqual('native')
  expect(v17.wallet.accounts[TEST_ADDRESS].address).toEqual(TEST_ADDRESS)
  expect(v17.wallet.accounts[TEST_ADDRESS].name).toEqual(ACCOUNT_NAME)
}

export function testRemoveEnsState(migration: (state: any) => any, prevSchema: any): void {
  const v17Stub = {
    ...prevSchema,
    ens: {},
  }
  const v18 = migration(v17Stub)
  expect(v18.ens).toBeUndefined()
}

export function testFilterToSupportedChains(migration: (state: any) => any, prevSchema: any): void {
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
    ...prevSchema,
    transactions,
    blocks,
    chains,
  }

  const v19 = migration(v18Stub)

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
}

export function testResetLastTxNotificationUpdate(migration: (state: any) => any, prevSchema: any): void {
  const v19Stub = {
    ...prevSchema,
    notifications: {
      ...prevSchema.notifications,
      lastTxNotificationUpdate: { 1: 122342134 },
    },
  }

  const v20 = migration(v19Stub)
  expect(v20.notifications.lastTxNotificationUpdate).toEqual({})
}

export function testAddExperimentsSlice(migration: (state: any) => any, prevSchema: any): void {
  const v20Stub = {
    ...prevSchema,
  }

  const v21 = migration(v20Stub)
  expect(v21.experiments).toBeDefined()
}

export function testRemoveCoingeckoApiAndTokenLists(migration: (state: any) => any, prevSchema: any): void {
  const v21Stub = {
    ...prevSchema,
    coingeckoApi: {},
  }
  const v22 = migration(v21Stub)
  expect(v22.coingeckoApi).toBeUndefined()
  expect(v22.tokens.watchedTokens).toBeUndefined()
  expect(v22.tokens.tokenPairs).toBeUndefined()
}

export function testResetTokensOrderByAndMetadataDisplayType(migration: (state: any) => any, prevSchema: any): void {
  const v22Stub = {
    ...prevSchema,
  }
  const v23 = migration(v22Stub)
  expect(v23.wallet.settings.tokensOrderBy).toBeUndefined()
  expect(v23.wallet.settings.tokensMetadataDisplayType).toBeUndefined()
}

export function testTransformNotificationCountToStatus(migration: (state: any) => any, prevSchema: any): void {
  const dummyAddress1 = '0xDumDum1'
  const dummyAddress2 = '0xDumDum2'
  const dummyAddress3 = '0xDumDum3'
  const v23Stub = {
    ...prevSchema,
    notifications: {
      ...prevSchema.notifications,
      notificationCount: { [dummyAddress1]: 5, [dummyAddress2]: 0, [dummyAddress3]: undefined },
    },
  }
  const v24 = migration(v23Stub)
  expect(v24.notifications.notificationCount).toBeUndefined()
  expect(v24.notifications.notificationStatus[dummyAddress1]).toBe(true)
  expect(v24.notifications.notificationStatus[dummyAddress2]).toBe(false)
  expect(v24.notifications.notificationStatus[dummyAddress2]).toBe(false)
}

export function testAddPasswordLockout(migration: (state: any) => any, prevSchema: any): void {
  const v24Stub = {
    ...prevSchema,
  }
  const v25 = migration(v24Stub)
  expect(v25.passwordLockout.passwordAttempts).toBe(0)
}

export function testRemoveShowSmallBalances(migration: (state: any) => any, prevSchema: any): void {
  const v25Stub = {
    ...prevSchema,
  }
  const v26 = migration(v25Stub)
  expect(v26.wallet.settings.showSmallBalances).toBeUndefined()
}

export function testResetTokensOrderBy(migration: (state: any) => any, prevSchema: any): void {
  const v26Stub = {
    ...prevSchema,
  }
  const v27 = migration(v26Stub)
  expect(v27.wallet.settings.tokensOrderBy).toBeUndefined()
}

export function testRemoveTokensMetadataDisplayType(migration: (state: any) => any, prevSchema: any): void {
  const v27Stub = {
    ...prevSchema,
  }
  const v28 = migration(v27Stub)
  expect(v28.wallet.settings.tokensMetadataDisplayType).toBeUndefined()
}

export function testRemoveTokenListsAndCustomTokens(migration: (state: any) => any, prevSchema: any): void {
  const v28Stub = {
    ...prevSchema,
  }
  const v29 = migration(v28Stub)
  expect(v29.tokenLists).toBeUndefined()
  expect(v29.tokens.customTokens).toBeUndefined()
}

export function testMigrateFiatPurchaseTransactionInfo(
  migration: (state: any) => any,
  prevSchema: any,
  account: { address: string },
  txDetailsConfirmed: any,
): void {
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
  const v29Stub = { ...prevSchema, transactions }

  const v30 = migration(v29Stub)

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
}

export function testResetEnsApi(migration: (state: any) => any, prevSchema: any): void {
  const v31Stub = { ...prevSchema, ENS: 'defined' }

  const v32 = migration(v31Stub)

  expect(v32.ENS).toBe(undefined)
}

export function testAddReplaceAccountOptions(migration: (state: any) => any, prevSchema: any): void {
  const v32Stub = { ...prevSchema }

  const v33 = migration(v32Stub)

  expect(v33.wallet.replaceAccountOptions.isReplacingAccount).toBe(false)
  expect(v33.wallet.replaceAccountOptions.skipToSeedPhrase).toBe(false)
}

export function testAddLastBalancesReport(migration: (state: any) => any, prevSchema: any): void {
  const v33Stub = { ...prevSchema }

  const v34 = migration(v33Stub)

  expect(v34.telemetry.lastBalancesReport).toBe(0)
}

export function testAddAppearanceSetting(migration: (state: any) => any, prevSchema: any): void {
  const v34Stub = { ...prevSchema }

  const v35 = migration(v34Stub)

  expect(v35.appearanceSettings.selectedAppearanceSettings).toBe('system')
}

export function testAddHiddenNfts(migration: (state: any) => any, prevSchema: any): void {
  const v35Stub = { ...prevSchema }

  const v36 = migration(v35Stub)

  expect(v36.favorites.hiddenNfts).toEqual({})
}

export function testCorrectFailedFiatOnRampTxIds(
  migration: (state: any) => any,
  prevSchema: any,
  account: { address: string },
  fiatOnRampTxDetailsFailed: any,
  txDetailsConfirmed: any,
): void {
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

  const v36Stub = { ...prevSchema, transactions }

  expect(v36Stub.transactions[account.address]?.[UniverseChainId.Mainnet][id1].typeInfo.id).toBeUndefined()
  expect(v36Stub.transactions[account.address]?.[UniverseChainId.Mainnet][id2].typeInfo.id).toBeUndefined()

  const v37 = migration(v36Stub)

  expect(v37.transactions[account.address]?.[UniverseChainId.Mainnet][id1].typeInfo.id).toEqual(
    fiatOnRampTxDetailsFailed.typeInfo.id,
  )
  expect(v36Stub.transactions[account.address]?.[UniverseChainId.Mainnet][id2].typeInfo.id).toBeUndefined()
  expect(v36Stub.transactions[account.address]?.[UniverseChainId.Mainnet][id3]).toEqual(txDetailsConfirmed)
}

export function testRemoveReplaceAccountOptions(migration: (state: any) => any, prevSchema: any): void {
  const v37Stub = { ...prevSchema }
  const v38 = migration(v37Stub)
  expect(v38.wallet.replaceAccountOptions).toBeUndefined()
}

export function testRemoveExperimentsSlice(migration: (state: any) => any, prevSchema: any): void {
  const v38Stub = { ...prevSchema }
  expect(v38Stub.experiments).toBeDefined()
  const v39 = migration(v38Stub)
  expect(v39.experiments).toBeUndefined()
}

export function testRemovePersistedWalletConnectSlice(migration: (state: any) => any, prevSchema: any): void {
  const v39Stub = { ...prevSchema }

  const v40 = migration(v39Stub)

  expect(v40.walletConnect).toBeUndefined()
}

export function testAddLastBalancesReportValue(migration: (state: any) => any, prevSchema: any): void {
  const v40Stub = { ...prevSchema }

  const v41 = migration(v40Stub)

  expect(v41.telemetry.lastBalancesReportValue).toBe(0)
}

export function testRemoveFlashbotsEnabledFromWalletSlice(migration: (state: any) => any, prevSchema: any): void {
  const v41Stub = { ...prevSchema }

  const v42 = migration(v41Stub)

  expect(v42.wallet.flashbotsenabled).toBeUndefined()
}

export function testConvertHiddenNftsToNftsData(migration: (state: any) => any, prevSchema: any): void {
  const v42Stub = { ...prevSchema }

  v42Stub.favorites.hiddenNfts = {
    '0xAFa9bAb987E3D7bcD40EB510838aEC663C8b7264': {
      'nftItem.0xb96e881BD4Cd7BCCc8CB47d3aa0e254a72d2F074.3971': true, // checksummed 1
      'nftItem.0xb96e881bd4cd7bccc8cb47d3aa0e254a72d2f074.3971': true, // not checksummed 1
      'nftItem.0x25E503331e69EFCBbc50d2a4D661900B23D47662.2': true, // checksummed 2
      'nftItem.0xe94abea3932576ff957a0b92190d0191aeb1a782.2': true, // not checksummed 3
    },
  }

  const v43 = migration(v42Stub)

  expect(v43.favorites.nftsData).toEqual({
    '0xAFa9bAb987E3D7bcD40EB510838aEC663C8b7264': {
      'nftItem.0xb96e881bd4cd7bccc8cb47d3aa0e254a72d2f074.3971': { isHidden: true }, // not checksummed 1
      'nftItem.0x25e503331e69efcbbc50d2a4d661900b23d47662.2': { isHidden: true }, // not checksummed 2
      'nftItem.0xe94abea3932576ff957a0b92190d0191aeb1a782.2': { isHidden: true }, // not checksummed 3
    },
  })
}

export function testRemoveProviders(migration: (state: any) => any, prevSchema: any): void {
  const v43Stub = { ...prevSchema }

  v43Stub.providers = { isInitialized: true }

  const v44 = migration(v43Stub)

  expect(v44.providers).toBeUndefined()
}

export function testAddTokensVisibility(migration: (state: any) => any, prevSchema: any): void {
  const v44Stub = { ...prevSchema }

  const v45 = migration(v44Stub)

  expect(v45.favorites.tokensVisibility).toEqual({})
}

export function testDeleteRTKQuerySlices(migration: (state: any) => any, prevSchema: any): void {
  const v45Stub = { ...prevSchema }
  const v46 = migration(v45Stub)

  expect(v46.ENS).toBeUndefined()
  expect(v46.ens).toBeUndefined()
  expect(v46.gasApi).toBeUndefined()
  expect(v46.onChainBalanceApi).toBeUndefined()
  expect(v46.routingApi).toBeUndefined()
  expect(v46.trmApi).toBeUndefined()
}

export function testResetActiveChains(migration: (state: any) => any, prevSchema: any): void {
  const v46Stub = { ...prevSchema }
  const v47 = migration(v46Stub)

  expect(v47.chains.byChainId).toStrictEqual({
    '1': { isActive: true },
    '10': { isActive: true },
    '56': { isActive: true },
    '137': { isActive: true },
    '8453': { isActive: true },
    '42161': { isActive: true },
  })
}

export function testAddTweaksStartingState(migration: (state: any) => any, prevSchema: any): void {
  const v47Stub = { ...prevSchema }
  const v48 = migration(v47Stub)

  expect(v48.tweaks).toEqual({})
}

export function testAddSwapProtectionSetting(migration: (state: any) => any, prevSchema: any): void {
  const v48Stub = { ...prevSchema }
  const v49 = migration(v48Stub)

  expect(v49.wallet.settings.swapProtection).toEqual(SwapProtectionSetting.On)
}

export function testDeleteChainsSlice(migration: (state: any) => any, prevSchema: any): void {
  const v49Stub = { ...prevSchema }
  const v50 = migration(v49Stub)

  expect(v50.chains).toBeUndefined()
}

export function testAddLanguageSettings(migration: (state: any) => any, prevSchema: any): void {
  const v50Stub = { ...prevSchema }
  const v51 = migration(v50Stub)

  expect(v51.languageSettings).not.toBeUndefined()
}

export function testAddFiatCurrencySettings(migration: (state: any) => any, prevSchema: any): void {
  const v51Stub = { ...prevSchema }
  const v52 = migration(v51Stub)

  expect(v52.fiatCurrencySettings).not.toBeUndefined()
}

export function testUpdateLanguageSettings(migration: (state: any) => any, prevSchema: any): void {
  const v52Stub = { ...prevSchema }
  const v53 = migration(v52Stub)

  expect(v53.languageSettings).not.toBeUndefined()
}

export function testAddWalletIsFunded(migration: (state: any) => any, prevSchema: any): void {
  const v53Stub = { ...prevSchema }
  const v54 = migration(v53Stub)

  expect(v54.telemetry.walletIsFunded).toBe(false)
}

export function testAddBehaviorHistory(migration: (state: any) => any, prevSchema: any): void {
  const v54Stub = { ...prevSchema }
  const v55 = migration(v54Stub)

  expect(v55.behaviorHistory.hasViewedReviewScreen).toBe(false)
}

export function testAddAllowAnalyticsSwitch(migration: (state: any) => any, prevSchema: any): void {
  const v55Stub = { ...prevSchema }
  const v56 = migration(v55Stub)

  expect(v56.telemetry.allowAnalytics).toBe(true)
  expect(v56.telemetry.lastHeartbeat).toBe(0)
}

export function testMoveSettingStateToGlobal(migration: (state: any) => any, prevSchema: any): void {
  const v56Stub = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
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
  const v57 = migration(v56Stub)
  expect(v57.wallet.settings.hideSmallBalances).toBe(true)
  expect(v57.wallet.settings.hideSpamTokens).toBe(true)
  expect(v57.wallet.accounts[0].showSpamTokens).toBeUndefined()
  expect(v57.wallet.accounts[0].showSmallBalances).toBeUndefined()
}

export function testAddSkippedUnitagBoolean(migration: (state: any) => any, prevSchema: any): void {
  const v57Stub = { ...prevSchema }
  const v58 = migration(v57Stub)

  expect(v58.behaviorHistory.hasSkippedUnitagPrompt).toBe(false)
}

export function testAddCompletedUnitagsIntroBoolean(migration: (state: any) => any, prevSchema: any): void {
  const v58Stub = { ...prevSchema }
  const v59 = migration(v58Stub)

  expect(v59.behaviorHistory.hasCompletedUnitagsIntroModal).toBe(false)
}

export function testAddUniconV2IntroModalBoolean(migration: (state: any) => any, prevSchema: any): void {
  const v59Stub = { ...prevSchema }
  const v60 = migration(v59Stub)

  expect(v60.behaviorHistory.hasViewedUniconV2IntroModal).toBe(false)
}

export function testFlattenTokenVisibility(migration: (state: any) => any, prevSchema: any): void {
  const v60Stub = { ...prevSchema }
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

  const v61 = migration(v60Stub)

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
}

export function testAddExtensionOnboardingState(migration: (state: any) => any, prevSchema: any): void {
  const v61Stub = { ...prevSchema }
  const v62 = migration(v61Stub)

  // Removed in schema 69
  expect(v62.behaviorHistory.extensionOnboardingState).toBe('Undefined')
}

export function testResetOnboardingStateForGA(migration: (state: any) => any, prevSchema: any): void {
  const v66Stub = { ...prevSchema }
  const v67 = migration(v66Stub)

  // Removed in migration 69
  expect(v67.behaviorHistory.extensionOnboardingState).toBe('Undefined')
}

export function testDeleteOldOnRampTxData(
  migration: (state: any) => any,
  prevSchema: any,
  account: { address: string },
  txDetailsConfirmed: any,
): void {
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
  const v73Stub = { ...prevSchema, transactions }

  const v74 = migration(v73Stub)

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
}

export function testAddPushNotifications(migration: (state: any) => any, prevSchema: any): void {
  // v82 didn't have a new schema
  const v82Stub = { ...prevSchema }
  const v83 = migration(v82Stub)

  expect(v83.pushNotifications.generalUpdatesEnabled).toBe(false)
  expect(v83.pushNotifications.priceAlertsEnabled).toBe(false)
}

export function testMigrateDappRequestInfoTypes(migration: (state: any) => any, prevSchema: any): void {
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

  const v86Stub = { ...prevSchema, ...stateWithUwulinkTransaction }
  const v87 = migration(v86Stub)

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

  const v86StubWalletConnect = { ...prevSchema, ...stateWithWalletConnectTransaction }
  const v87WalletConnect = migration(v86StubWalletConnect)

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
}

export function testMigrateAndRemoveCloudBackupSlice(migration: (state: any) => any, prevSchema: any): void {
  const androidCloudBackupEmail = 'test@test.com'

  const { cloudBackup: _oldCloudBackup, ...v91WithoutCloudBackup } = prevSchema

  const v91WithoutCloudBackupSlice = {
    ...v91WithoutCloudBackup,
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: '0xabc',
    },
  }

  const v91WithCloudBackup = {
    ...v91WithoutCloudBackupSlice,
    cloudBackup: {
      backupsFound: [{ mnemonicId: '0xabc', email: androidCloudBackupEmail }],
    },
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: '0xabc',
    },
  }

  const v91WithDifferentActiveAccountAddress = {
    ...v91WithoutCloudBackupSlice,
    cloudBackup: {
      backupsFound: [{ mnemonicId: '0xdef', email: androidCloudBackupEmail }],
    },
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: '0xabc',
    },
  }

  const v92 = migration(v91WithCloudBackup)
  expect(v92.cloudBackup).toBeUndefined()
  expect(v92.wallet.androidCloudBackupEmail).toBe(androidCloudBackupEmail)

  const v92WithoutCloudBackup = migration(v91WithoutCloudBackupSlice)
  expect(v92WithoutCloudBackup.cloudBackup).toBeUndefined()
  expect(v92WithoutCloudBackup.wallet.androidCloudBackupEmail).toBe(undefined)

  const v92WithDifferentActiveAccountAddress = migration(v91WithDifferentActiveAccountAddress)
  expect(v92WithDifferentActiveAccountAddress.cloudBackup).toBeUndefined()
  expect(v92WithDifferentActiveAccountAddress.wallet.androidCloudBackupEmail).toBe(androidCloudBackupEmail)
}
