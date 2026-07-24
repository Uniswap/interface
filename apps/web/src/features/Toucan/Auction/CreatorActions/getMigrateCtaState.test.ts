import { describe, expect, it } from 'vitest'
import { getMigrateCtaState } from '~/features/Toucan/Auction/CreatorActions/getMigrateCtaState'
import { AuctionOutcome } from '~/features/Toucan/Auction/store/types'
import { getLbpMigrationState } from '~/features/Toucan/Auction/utils/creatorActions'

const STRATEGY = '0x00004c4ccc709Ef590F7C81102C0689F0263D4e9'

function migration({
  currentBlockNumber,
  lbpMigrationTxHash,
  ...rest
}: {
  currentBlockNumber: number | undefined
  lbpMigrationTxHash?: string
  lbpMigrationBlock?: string
}) {
  return getLbpMigrationState({
    lbpStrategyAddress: STRATEGY,
    lbpMigrationBlock: 'lbpMigrationBlock' in rest ? rest.lbpMigrationBlock : '1000',
    lbpMigrationTxHash,
    currentBlockNumber,
  })
}

const base = {
  outcome: AuctionOutcome.GRADUATED,
  isConnectedTokensRecipient: false,
  hasLocallyMigrated: false,
}

describe('getMigrateCtaState', () => {
  it('hidden unless the auction graduated', () => {
    for (const outcome of [AuctionOutcome.UNKNOWN, AuctionOutcome.ACTIVE, AuctionOutcome.FAILED]) {
      expect(getMigrateCtaState({ ...base, outcome, migration: migration({ currentBlockNumber: 2000 }) })).toEqual({
        visible: false,
        enabled: false,
        showComplete: false,
      })
    }
  })

  it('enabled for anyone once the migration block is reached', () => {
    expect(getMigrateCtaState({ ...base, migration: migration({ currentBlockNumber: 1000 }) })).toEqual({
      visible: true,
      enabled: true,
      showComplete: false,
    })
  })

  it('hidden for non-creators before the migration block', () => {
    expect(getMigrateCtaState({ ...base, migration: migration({ currentBlockNumber: 999 }) })).toEqual({
      visible: false,
      enabled: false,
      showComplete: false,
    })
  })

  it('visible but disabled for the creator before the migration block', () => {
    expect(
      getMigrateCtaState({
        ...base,
        isConnectedTokensRecipient: true,
        migration: migration({ currentBlockNumber: 999 }),
      }),
    ).toEqual({ visible: true, enabled: false, showComplete: false })
  })

  it('hidden for the creator when no migration block is indexed (old-factory auctions)', () => {
    expect(
      getMigrateCtaState({
        ...base,
        isConnectedTokensRecipient: true,
        migration: migration({ currentBlockNumber: 2000, lbpMigrationBlock: undefined }),
      }),
    ).toEqual({ visible: false, enabled: false, showComplete: false })
  })

  it('hidden once the API reports the migration ran', () => {
    expect(
      getMigrateCtaState({
        ...base,
        migration: migration({ currentBlockNumber: 2000, lbpMigrationTxHash: '0xabc' }),
      }),
    ).toEqual({ visible: false, enabled: false, showComplete: false })
  })

  it('shows the done state right after a locally-confirmed migration', () => {
    expect(
      getMigrateCtaState({
        ...base,
        hasLocallyMigrated: true,
        migration: migration({ currentBlockNumber: 2000 }),
      }),
    ).toEqual({ visible: true, enabled: false, showComplete: true })
  })
})
