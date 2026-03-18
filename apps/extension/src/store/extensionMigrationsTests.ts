/**
 * Test helpers for testing migrations run in sequence.
 *
 * Called by migrations.test.ts to verify migrations work correctly with realistic
 * data that has passed through all prior migrations in the chain.
 *
 * For unit tests of individual migrations, see extensionMigrations.test.ts.
 */
import { createThrowingProxy } from 'utilities/src/test/utils'

export function testRemoveDappInfoToChromeLocalStorage(migration: (state: any) => any, _prevSchema: any): void {
  // Test: removes dapp property from state
  const result = migration({
    dapp: { someData: 'value' },
    otherData: 'preserved',
  })

  expect(result.dapp).toBeUndefined()
  expect(result.otherData).toBe('preserved')

  // Test: handles state without dapp property
  const resultWithoutDapp = migration({
    otherData: 'preserved',
  })

  expect(resultWithoutDapp.dapp).toBeUndefined()
  expect(resultWithoutDapp.otherData).toBe('preserved')
}

export function testMigratePendingDappRequestsToRecord(migration: (state: any) => any, _prevSchema: any): void {
  // Test: empty pending → empty requests
  expect(
    migration({
      dappRequests: { pending: [] },
      otherData: 'value',
    }),
  ).toEqual({
    dappRequests: { requests: {} },
    otherData: 'value',
  })

  // Test: sets sequential timestamps
  const mockTime = 1000
  jest.spyOn(Date, 'now').mockReturnValue(mockTime)

  const timestampResult = migration({
    dappRequests: {
      pending: [0, 1, 2].map((i) => ({ dappRequest: { requestId: `r${i}` } })),
    },
  })

  expect(timestampResult.dappRequests.requests.r0.createdAt).toBe(mockTime)
  expect(timestampResult.dappRequests.requests.r1.createdAt).toBe(mockTime + 1000)
  expect(timestampResult.dappRequests.requests.r2.createdAt).toBe(mockTime + 2000)

  jest.restoreAllMocks()

  // Test: preserves data and handles missing IDs
  const mockData = {
    dappRequests: {
      pending: [
        { dappRequest: { type: 'Missing' } }, // Missing ID
        { dappRequest: { requestId: 'id', data: { x: 1 } }, meta: 'kept' },
      ],
    },
  }

  const dataResult = migration(mockData)

  // Verify only valid request exists and contains original data
  expect(Object.keys(dataResult.dappRequests.requests)).toEqual(['id'])
  expect(dataResult.dappRequests.requests.id).toMatchObject({
    dappRequest: { requestId: 'id', data: { x: 1 } },
    meta: 'kept',
    createdAt: expect.any(Number),
  })

  // Test: fallback on error - uses a throwing proxy to trigger catch block
  const errorResult = migration({
    dappRequests: { pending: createThrowingProxy([], { throwingMethods: ['forEach'] }) },
    otherData: 'preserved',
  })
  expect(errorResult.dappRequests).toEqual({ requests: {} })
  expect(errorResult.otherData).toBe('preserved')
}

export function testMigrateUnknownBackupAccountsToMaybeManualBackup(
  migration: (state: any) => any,
  _prevSchema: any,
): void {
  // it should migrate all accounts to manual backup when the account has an empty backups array
  const migration1 = migration({
    wallet: {
      accounts: {
        '0x1': {
          address: '0x1',
          backups: [],
        },
        '0x2': {
          address: '0x2',
          backups: [],
        },
      },
    },
  })

  expect(migration1.wallet.accounts['0x1'].backups).toEqual(['maybe-manual'])
  expect(migration1.wallet.accounts['0x2'].backups).toEqual(['maybe-manual'])

  // it should migrate all accounts to manual backup when the account has a no backups property
  const migration2 = migration({
    wallet: {
      accounts: {
        '0x1': {
          address: '0x1',
          backups: undefined,
        },
        '0x2': {
          address: '0x2',
          backups: undefined,
        },
      },
    },
  })

  expect(migration2.wallet.accounts['0x1'].backups).toEqual(['maybe-manual'])
  expect(migration2.wallet.accounts['0x2'].backups).toEqual(['maybe-manual'])

  // it should not migrate accounts to manual backup when the account has a backups property
  const migration3 = migration({
    wallet: {
      accounts: {
        '0x1': {
          address: '0x1',
          backups: ['cloud'],
        },
        '0x2': {
          address: '0x2',
          backups: ['cloud'],
        },
      },
    },
  })

  expect(migration3.wallet.accounts['0x1'].backups).toEqual(['cloud'])
  expect(migration3.wallet.accounts['0x2'].backups).toEqual(['cloud'])
}

export function testSetLanguageToNavigatorLanguage(migration: (state: any) => any, _prevSchema: any): void {
  // Test: sets language when userSettings exists
  const result = migration({
    userSettings: {
      currentLanguage: 'es',
      otherSetting: 'preserved',
    },
  })

  expect(result.userSettings.currentLanguage).toBeDefined()
  expect(result.userSettings.otherSetting).toBe('preserved')

  // Test: returns state unchanged when userSettings doesn't exist
  const resultWithoutUserSettings = migration({
    otherData: 'preserved',
  })

  expect(resultWithoutUserSettings.userSettings).toBeUndefined()
  expect(resultWithoutUserSettings.otherData).toBe('preserved')
}
