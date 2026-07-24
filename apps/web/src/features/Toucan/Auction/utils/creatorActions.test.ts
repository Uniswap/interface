import { describe, expect, it } from 'vitest'
import {
  getLbpMigrationState,
  hasSweptUnsoldTokens,
  isTokensRecipient,
} from '~/features/Toucan/Auction/utils/creatorActions'

const RECIPIENT = '0x298eA05D0356B2Ae5cCAa3169E471783ee9EA000'
const STRATEGY = '0x00004c4ccc709Ef590F7C81102C0689F0263D4e9'

describe('isTokensRecipient', () => {
  it('matches addresses case-insensitively', () => {
    const lowercased = '0x298ea05d0356b2ae5ccaa3169e471783ee9ea000'
    expect(isTokensRecipient({ connectedAddress: lowercased, tokensRecipient: RECIPIENT })).toBe(true)
    expect(isTokensRecipient({ connectedAddress: RECIPIENT, tokensRecipient: lowercased })).toBe(true)
  })

  it('is false for a different wallet', () => {
    expect(isTokensRecipient({ connectedAddress: STRATEGY, tokensRecipient: RECIPIENT })).toBe(false)
  })

  it('is false when either side is missing', () => {
    expect(isTokensRecipient({ connectedAddress: undefined, tokensRecipient: RECIPIENT })).toBe(false)
    expect(isTokensRecipient({ connectedAddress: RECIPIENT, tokensRecipient: undefined })).toBe(false)
    expect(isTokensRecipient({ connectedAddress: RECIPIENT, tokensRecipient: '' })).toBe(false)
  })
})

describe('hasSweptUnsoldTokens', () => {
  it('is undefined while the chain read is pending', () => {
    expect(hasSweptUnsoldTokens(undefined)).toBeUndefined()
  })

  it('is false while the one-shot latch is 0', () => {
    expect(hasSweptUnsoldTokens('0')).toBe(false)
  })

  it('is true once the latch holds the sweep block', () => {
    expect(hasSweptUnsoldTokens('12345678')).toBe(true)
  })

  it('is undefined for malformed values', () => {
    expect(hasSweptUnsoldTokens('not-a-number')).toBeUndefined()
  })
})

describe('getLbpMigrationState', () => {
  const base = {
    lbpStrategyAddress: STRATEGY,
    lbpMigrationBlock: '1000',
    lbpMigrationTxHash: undefined,
    currentBlockNumber: 999,
  }

  it('is not migratable before the migration block', () => {
    const state = getLbpMigrationState(base)
    expect(state).toEqual({
      hasMigrated: false,
      migrationBlock: 1000,
      isMigrationBlockReached: false,
      canMigrate: false,
    })
  })

  it('becomes migratable at the migration block', () => {
    const state = getLbpMigrationState({ ...base, currentBlockNumber: 1000 })
    expect(state.isMigrationBlockReached).toBe(true)
    expect(state.canMigrate).toBe(true)
  })

  it('is done once lbpMigrationTxHash is set', () => {
    const state = getLbpMigrationState({ ...base, currentBlockNumber: 2000, lbpMigrationTxHash: '0xabc' })
    expect(state.hasMigrated).toBe(true)
    expect(state.canMigrate).toBe(false)
  })

  it('never becomes migratable without an indexed migration block (old-factory auctions)', () => {
    const state = getLbpMigrationState({ ...base, lbpMigrationBlock: undefined, currentBlockNumber: 10_000_000 })
    expect(state.migrationBlock).toBeUndefined()
    expect(state.canMigrate).toBe(false)
  })

  it('never becomes migratable without a strategy address', () => {
    const state = getLbpMigrationState({ ...base, lbpStrategyAddress: undefined, currentBlockNumber: 2000 })
    expect(state.canMigrate).toBe(false)
  })

  it('is not migratable while the current block is unknown', () => {
    const state = getLbpMigrationState({ ...base, currentBlockNumber: undefined })
    expect(state.canMigrate).toBe(false)
  })
})
