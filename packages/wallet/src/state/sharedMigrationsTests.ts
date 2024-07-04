/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'

export function testActivatePendingAccounts(migration: (state: any) => any, prevSchema: any): void {
  // all accounts active
  const SchemaAllActive = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: '0xTest0',
      accounts: {
        '0xTest0': {
          type: AccountType.SignerMnemonic,
          address: '0xTest0',
          mnemonicId: '111',
          name: 'Test Account 1',
          pending: false,
          derivationIndex: 0,
          timeImportedMs: 1,
        },
        '0xTest1': {
          type: AccountType.SignerMnemonic,
          address: '0xTest1',
          mnemonicId: '111',
          name: 'Test Account 2',
          derivationIndex: 1,
          timeImportedMs: 2,
        },
        '0xTest2': {
          type: AccountType.SignerMnemonic,
          address: '0xTest2',
          mnemonicId: '111',
          name: 'Test Account 3',
          pending: false,
          derivationIndex: 2,
          timeImportedMs: 3,
        },
        '0xTest3': {
          type: AccountType.Readonly,
          address: '0xTest3',
          name: 'Test Account 4',
          derivationIndex: 0,
          timeImportedMs: 4,
        },
        '0xTest4': {
          type: AccountType.SignerMnemonic,
          address: '0xTest4',
          mnemonicId: '111',
          name: 'Test Account 5',
          pending: false,
          derivationIndex: 0,
          timeImportedMs: 5,
        },
        '0xTest5': {
          type: AccountType.SignerMnemonic,
          address: '0xTest5',
          mnemonicId: '222',
          name: 'Test Account 6',
          pending: false,
          derivationIndex: 1,
          timeImportedMs: 6,
        },
      } as Record<string, Account>,
    },
  }
  const SchemaAllActiveMigrated = migration(SchemaAllActive)

  expect(Object.keys(SchemaAllActiveMigrated.wallet.accounts)).toIncludeSameMembers([
    '0xTest0',
    '0xTest1',
    '0xTest2',
    '0xTest3',
    '0xTest4',
    '0xTest5',
  ])
  Object.values(SchemaAllActiveMigrated.wallet.accounts).forEach((acc: any) => {
    expect(acc.pending).toBeUndefined()
  })
  expect(SchemaAllActiveMigrated.wallet.activeAccountAddress).toBe('0xTest0')

  // no active address and no accounts
  const SchemaNoAccounts = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      accounts: {},
    },
  }
  const SchemaNoAccountsMigrated = migration(SchemaNoAccounts)

  expect(Object.keys(SchemaNoAccountsMigrated.wallet.accounts)).toHaveLength(0)
  Object.values(SchemaNoAccountsMigrated.wallet.accounts).forEach((acc: any) => {
    expect(acc.pending).toBeUndefined()
  })
  expect(SchemaNoAccountsMigrated.wallet.activeAccountAddress).toBeNull()

  // active address and no accounts
  const SchemaNoAccountsAndActiveAddress = {
    ...prevSchema,
    activeAccountAddress: '0xTest0',
    wallet: {
      ...prevSchema.wallet,
      accounts: {},
    },
  }
  const SchemaNoAccountsAndActiveAddressMigrated = migration(SchemaNoAccountsAndActiveAddress)

  expect(Object.keys(SchemaNoAccountsAndActiveAddressMigrated.wallet.accounts)).toHaveLength(0)
  Object.values(SchemaNoAccountsAndActiveAddressMigrated.wallet.accounts).forEach((acc: any) => {
    expect(acc.pending).toBeUndefined()
  })
  expect(SchemaNoAccountsAndActiveAddressMigrated.wallet.activeAccountAddress).toBeNull()

  // no active address and some accounts
  const SchemaNoActiveAddress = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: null,
      accounts: {
        '0xTest0': {
          type: AccountType.SignerMnemonic,
          address: '0xTest0',
          mnemonicId: '111',
          name: 'Test Account 1',
          pending: false,
          derivationIndex: 0,
          timeImportedMs: 1,
        },
        '0xTest1': {
          type: AccountType.SignerMnemonic,
          address: '0xTest1',
          mnemonicId: '111',
          name: 'Test Account 2',
          pending: true,
          derivationIndex: 1,
          timeImportedMs: 2,
        },
        '0xTest2': {
          type: AccountType.SignerMnemonic,
          address: '0xTest2',
          mnemonicId: '111',
          name: 'Test Account 3',
          pending: true,
          derivationIndex: 2,
          timeImportedMs: 3,
        },
        '0xTest3': {
          type: AccountType.Readonly,
          address: '0xTest3',
          name: 'Test Account 4',
          timeImportedMs: 4,
        },
        '0xTest4': {
          type: AccountType.Readonly,
          address: '0xTest4',
          name: 'Test Account 5',
          pending: true,
          timeImportedMs: 5,
        },
        '0xTest5': {
          type: AccountType.SignerMnemonic,
          address: '0xTest5',
          mnemonicId: '111',
          name: 'Test Account 6',
          pending: true,
          derivationIndex: 0,
          timeImportedMs: 6,
        },
      } as Record<string, Account>,
    },
  }

  const SchemaNoActiveAddressMigrated = migration(SchemaNoActiveAddress)

  expect(Object.keys(SchemaNoActiveAddressMigrated.wallet.accounts)).toIncludeSameMembers([
    '0xTest0',
    '0xTest3',
    '0xTest4',
  ])
  Object.values(SchemaNoActiveAddressMigrated.wallet.accounts).forEach((acc: any) => {
    expect(acc.pending).toBeUndefined()
  })
  expect(SchemaNoActiveAddressMigrated.wallet.activeAccountAddress).toBeDefined()

  // only view-only accounts
  const SchemaOnlyViewOnly = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: '0xTest3',
      accounts: {
        '0xTest3': {
          type: AccountType.Readonly,
          address: '0xTest3',
          name: 'Test Account 4',
          timeImportedMs: 4,
        },
        '0xTest4': {
          type: AccountType.Readonly,
          address: '0xTest4',
          name: 'Test Account 5',
          pending: true,
          timeImportedMs: 5,
        },
        '0xTest5': {
          type: AccountType.Readonly,
          address: '0xTest5',
          name: 'Test Account 6',
          pending: true,
          timeImportedMs: 5,
        },
      } as Record<string, Account>,
    },
  }

  const SchemaOnlyViewOnlyMigrated = migration(SchemaOnlyViewOnly)

  expect(Object.keys(SchemaOnlyViewOnlyMigrated.wallet.accounts)).toIncludeSameMembers([
    '0xTest3',
    '0xTest4',
    '0xTest5',
  ])
  Object.values(SchemaOnlyViewOnlyMigrated.wallet.accounts).forEach((acc: any) => {
    expect(acc.pending).toBeUndefined()
  })
  expect(SchemaOnlyViewOnlyMigrated.wallet.activeAccountAddress).toBe('0xTest3')

  // mixed accounts with a view-only active account address
  const SchemaMixedWithActiveViewOnly = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: '0xTest3',
      accounts: {
        '0xTest0': {
          type: AccountType.SignerMnemonic,
          address: '0xTest0',
          mnemonicId: '111',
          name: 'Test Account 1',
          pending: false,
          derivationIndex: 0,
          timeImportedMs: 1,
        },
        '0xTest1': {
          type: AccountType.SignerMnemonic,
          address: '0xTest1',
          mnemonicId: '111',
          name: 'Test Account 2',
          pending: true,
          derivationIndex: 1,
          timeImportedMs: 2,
        },
        '0xTest2': {
          type: AccountType.SignerMnemonic,
          address: '0xTest2',
          mnemonicId: '111',
          name: 'Test Account 3',
          pending: true,
          derivationIndex: 2,
          timeImportedMs: 3,
        },
        '0xTest3': {
          type: AccountType.Readonly,
          address: '0xTest3',
          name: 'Test Account 4',
          timeImportedMs: 4,
        },
        '0xTest4': {
          type: AccountType.Readonly,
          address: '0xTest4',
          name: 'Test Account 5',
          pending: true,
          timeImportedMs: 5,
        },
        '0xTest5': {
          type: AccountType.SignerMnemonic,
          address: '0xTest5',
          mnemonicId: '111',
          name: 'Test Account 6',
          derivationIndex: 0,
          timeImportedMs: 6,
        },
      } as Record<string, Account>,
    },
  }

  const SchemaMixedWithActiveViewOnlyMigrated = migration(SchemaMixedWithActiveViewOnly)

  expect(Object.keys(SchemaMixedWithActiveViewOnlyMigrated.wallet.accounts)).toIncludeSameMembers([
    '0xTest0',
    '0xTest3',
    '0xTest4',
    '0xTest5',
  ])
  Object.values(SchemaMixedWithActiveViewOnlyMigrated.wallet.accounts).forEach((acc: any) => {
    expect(acc.pending).toBeUndefined()
  })
  expect(SchemaMixedWithActiveViewOnlyMigrated.wallet.activeAccountAddress).toBe('0xTest3')

  // mixed accounts with a signer active account address and 7 pending accounts
  const Schema7PendingAccounts = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: '0xTest0',
      accounts: {
        '0xTest0': {
          type: AccountType.SignerMnemonic,
          address: '0xTest0',
          mnemonicId: '111',
          name: 'Test Account 1',
          pending: false,
          derivationIndex: 0,
          timeImportedMs: 1,
        },
        '0xTest1': {
          type: AccountType.SignerMnemonic,
          address: '0xTest1',
          mnemonicId: '111',
          name: 'Test Account 2',
          pending: true,
          derivationIndex: 1,
          timeImportedMs: 2,
        },
        '0xTest2': {
          type: AccountType.SignerMnemonic,
          address: '0xTest2',
          mnemonicId: '111',
          name: 'Test Account 3',
          pending: true,
          derivationIndex: 2,
          timeImportedMs: 3,
        },
        '0xTest3': {
          type: AccountType.SignerMnemonic,
          address: '0xTest3',
          mnemonicId: '111',
          name: 'Test Account 4',
          pending: true,
          derivationIndex: 3,
          timeImportedMs: 4,
        },
        '0xTest4': {
          type: AccountType.SignerMnemonic,
          address: '0xTest4',
          mnemonicId: '111',
          name: 'Test Account 5',
          pending: true,
          derivationIndex: 4,
          timeImportedMs: 5,
        },
        '0xTest5': {
          type: AccountType.SignerMnemonic,
          address: '0xTest5',
          mnemonicId: '111',
          name: 'Test Account 6',
          pending: true,
          derivationIndex: 5,
          timeImportedMs: 6,
        },
        '0xTest6': {
          type: AccountType.SignerMnemonic,
          address: '0xTest6',
          mnemonicId: '111',
          name: 'Test Account 7',
          pending: true,
          derivationIndex: 6,
          timeImportedMs: 7,
        },
        '0xTest7': {
          type: AccountType.SignerMnemonic,
          address: '0xTest7',
          mnemonicId: '111',
          name: 'Test Account 8',
          pending: true,
          derivationIndex: 7,
          timeImportedMs: 8,
        },
      },
    },
  }

  const Schema7PendingAccountsMigrated = migration(Schema7PendingAccounts)

  expect(Object.keys(Schema7PendingAccountsMigrated.wallet.accounts)).toIncludeSameMembers([
    '0xTest0',
    '0xTest1',
    '0xTest2',
    '0xTest3',
    '0xTest5',
    '0xTest6',
    '0xTest7',
  ])
  Object.values(Schema7PendingAccountsMigrated.wallet.accounts).forEach((acc: any) => {
    expect(acc.pending).toBeUndefined()
  })
  expect(Schema7PendingAccountsMigrated.wallet.activeAccountAddress).toBe('0xTest0')

  // mixed accounts with a signer active account address and 8 pending accounts
  // + active account address account deleted
  const Schema8PendingAccountsActiveAddressInTheMiddle = {
    ...prevSchema,
    wallet: {
      ...prevSchema.wallet,
      activeAccountAddress: '0xTest5',
      accounts: {
        '0xTest0': {
          type: AccountType.SignerMnemonic,
          address: '0xTest0',
          mnemonicId: '111',
          name: 'Test Account 1',
          pending: true,
          derivationIndex: 0,
          timeImportedMs: 1,
        },
        '0xTest1': {
          type: AccountType.SignerMnemonic,
          address: '0xTest1',
          mnemonicId: '111',
          name: 'Test Account 2',
          pending: false,
          derivationIndex: 1,
          timeImportedMs: 2,
        },
        '0xTest2': {
          type: AccountType.SignerMnemonic,
          address: '0xTest2',
          mnemonicId: '111',
          name: 'Test Account 3',
          pending: true,
          derivationIndex: 2,
          timeImportedMs: 3,
        },
        '0xTest3': {
          type: AccountType.SignerMnemonic,
          address: '0xTest3',
          mnemonicId: '111',
          name: 'Test Account 4',
          pending: true,
          derivationIndex: 3,
          timeImportedMs: 4,
        },
        '0xTest4': {
          type: AccountType.SignerMnemonic,
          address: '0xTest4',
          mnemonicId: '111',
          name: 'Test Account 5',
          pending: true,
          derivationIndex: 4,
          timeImportedMs: 5,
        },
        '0xTest5': {
          type: AccountType.SignerMnemonic,
          address: '0xTest5',
          mnemonicId: '111',
          name: 'Test Account 6',
          pending: true,
          derivationIndex: 5,
          timeImportedMs: 6,
        },
        '0xTest6': {
          type: AccountType.SignerMnemonic,
          address: '0xTest6',
          mnemonicId: '111',
          name: 'Test Account 7',
          pending: true,
          derivationIndex: 6,
          timeImportedMs: 7,
        },
        '0xTest7': {
          type: AccountType.SignerMnemonic,
          address: '0xTest7',
          mnemonicId: '111',
          name: 'Test Account 8',
          pending: true,
          derivationIndex: 7,
          timeImportedMs: 8,
        },
        '0xTest8': {
          type: AccountType.SignerMnemonic,
          address: '0xTest8',
          mnemonicId: '111',
          name: 'Test Account 9',
          pending: true,
          derivationIndex: 8,
          timeImportedMs: 9,
        },
      },
    },
  }

  const Schema8PendingAccountsActiveAddressInTheMiddleMigrated = migration(
    Schema8PendingAccountsActiveAddressInTheMiddle,
  )

  expect(Object.keys(Schema8PendingAccountsActiveAddressInTheMiddleMigrated.wallet.accounts)).toIncludeSameMembers([
    '0xTest0',
    '0xTest1',
    '0xTest2',
    '0xTest3',
    '0xTest5',
    '0xTest6',
    '0xTest7',
    '0xTest8',
  ])
  Object.values(Schema8PendingAccountsActiveAddressInTheMiddleMigrated.wallet.accounts).forEach((acc: any) => {
    expect(acc.pending).toBeUndefined()
  })
  expect(Schema8PendingAccountsActiveAddressInTheMiddleMigrated.wallet.activeAccountAddress).toBe('0xTest5')
}
