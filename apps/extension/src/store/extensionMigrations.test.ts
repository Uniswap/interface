/**
 * Isolated tests for individual migration functions.
 *
 * Tests each migration independently with various input states, edge cases,
 * and error handling, without relying on output from previous migrations.
 *
 * For tests of the full migration chain, see extensionMigrationsTests.ts.
 */
import { DappRequestStatus } from 'src/app/features/dappRequests/shared'
import {
  migratePendingDappRequestsToRecord,
  migrateUnknownBackupAccountsToMaybeManualBackup,
  removeDappInfoToChromeLocalStorage,
  setLanguageToNavigatorLanguage,
} from 'src/store/extensionMigrations'
import { Language } from 'uniswap/src/features/language/constants'
import { createThrowingProxy } from 'utilities/src/test/utils'

describe('removeDappInfoToChromeLocalStorage', () => {
  it('removes dapp from state', () => {
    const state = { dapp: { someData: true }, otherData: 'preserved' }
    const result = removeDappInfoToChromeLocalStorage(state)
    expect(result.dapp).toBeUndefined()
    expect(result.otherData).toBe('preserved')
  })

  it('handles state without dapp', () => {
    const state = { otherData: 'preserved' }
    const result = removeDappInfoToChromeLocalStorage(state)
    expect(result.otherData).toBe('preserved')
  })
})

describe('migratePendingDappRequestsToRecord', () => {
  it('migrates pending array to requests record', () => {
    const state = {
      dappRequests: {
        pending: [
          { dappRequest: { requestId: 'req1', data: 'test1' } },
          { dappRequest: { requestId: 'req2', data: 'test2' } },
        ],
      },
    }
    const result = migratePendingDappRequestsToRecord(state)
    expect(result.dappRequests.requests.req1).toBeDefined()
    expect(result.dappRequests.requests.req1.status).toBe(DappRequestStatus.Pending)
    expect(result.dappRequests.requests.req1.createdAt).toBeDefined()
    expect(result.dappRequests.requests.req2).toBeDefined()
    expect(result.dappRequests.pending).toBeUndefined()
  })

  it('returns state unchanged if no dappRequests', () => {
    const state = { otherData: 'preserved' }
    const result = migratePendingDappRequestsToRecord(state)
    expect(result).toEqual(state)
  })

  it('returns state unchanged if already migrated (has requests)', () => {
    const state = {
      dappRequests: {
        requests: { req1: { status: DappRequestStatus.Pending } },
      },
    }
    const result = migratePendingDappRequestsToRecord(state)
    expect(result).toEqual(state)
  })

  it('returns state unchanged if no pending array', () => {
    const state = { dappRequests: {} }
    const result = migratePendingDappRequestsToRecord(state)
    expect(result).toEqual(state)
  })

  it('clears dappRequests if pending is not an array', () => {
    const state = { dappRequests: { pending: 'invalid' } }
    const result = migratePendingDappRequestsToRecord(state)
    expect(result.dappRequests).toEqual({ requests: {} })
  })

  it('skips invalid items in pending array', () => {
    const state = {
      dappRequests: {
        pending: [
          null,
          'invalid',
          { notDappRequest: true },
          { dappRequest: null },
          { dappRequest: { noRequestId: true } },
          { dappRequest: { requestId: 'validReq', data: 'test' } },
        ],
      },
    }
    const result = migratePendingDappRequestsToRecord(state)
    expect(Object.keys(result.dappRequests.requests)).toEqual(['validReq'])
  })

  it('falls back to empty requests on error', () => {
    const state = {
      dappRequests: {
        pending: createThrowingProxy([], { throwingMethods: ['forEach'] }),
      },
    }
    const result = migratePendingDappRequestsToRecord(state)
    expect(result.dappRequests).toEqual({ requests: {} })
  })
})

describe('migrateUnknownBackupAccountsToMaybeManualBackup', () => {
  it('adds maybe-manual backup to accounts without backups', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { address: '0x123' },
          '0x456': { address: '0x456', backups: [] },
        },
      },
    }
    const result = migrateUnknownBackupAccountsToMaybeManualBackup(state)
    expect(result.wallet.accounts['0x123'].backups).toEqual(['maybe-manual'])
    expect(result.wallet.accounts['0x456'].backups).toEqual(['maybe-manual'])
  })

  it('preserves existing backups', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': { address: '0x123', backups: ['cloud'] },
        },
      },
    }
    const result = migrateUnknownBackupAccountsToMaybeManualBackup(state)
    expect(result.wallet.accounts['0x123'].backups).toEqual(['cloud'])
  })

  it('returns state unchanged if no wallet', () => {
    const state = { otherData: 'preserved' }
    const result = migrateUnknownBackupAccountsToMaybeManualBackup(state)
    expect(result).toEqual(state)
  })

  it('returns state unchanged if no accounts', () => {
    const state = { wallet: { otherData: 'preserved' } }
    const result = migrateUnknownBackupAccountsToMaybeManualBackup(state)
    expect(result).toEqual(state)
  })

  it('returns state unchanged if accounts is not an object', () => {
    const state = { wallet: { accounts: 'invalid' } }
    const result = migrateUnknownBackupAccountsToMaybeManualBackup(state)
    expect(result).toEqual(state)
  })

  it('skips non-object accounts', () => {
    const state = {
      wallet: {
        accounts: {
          '0x123': 'invalid',
          '0x456': { address: '0x456' },
        },
      },
    }
    const result = migrateUnknownBackupAccountsToMaybeManualBackup(state)
    expect(result.wallet.accounts['0x123']).toBeUndefined()
    expect(result.wallet.accounts['0x456'].backups).toEqual(['maybe-manual'])
  })
})

describe('setLanguageToNavigatorLanguage', () => {
  it('sets language from navigator', () => {
    const state = { userSettings: { otherSetting: true } }
    const result = setLanguageToNavigatorLanguage(state)
    expect(result.userSettings.currentLanguage).toBeDefined()
    expect(result.userSettings.otherSetting).toBe(true)
  })

  it('returns state unchanged if no userSettings', () => {
    const state = { otherData: 'preserved' }
    const result = setLanguageToNavigatorLanguage(state)
    expect(result).toEqual(state)
  })

  it('falls back to English on error', () => {
    const state = {
      userSettings: createThrowingProxy({}, { throwingMethods: ['*'] }),
    }
    const result = setLanguageToNavigatorLanguage(state)
    expect(result.userSettings.currentLanguage).toBe(Language.English)
  })
})
