import { AuctionOutcome } from '~/features/Toucan/Auction/store/types'
import type { LbpMigrationState } from '~/features/Toucan/Auction/utils/creatorActions'

export interface MigrateCtaState {
  visible: boolean
  // The migrate transaction can be sent right now
  enabled: boolean
  // Migration just confirmed in this session (data-api's lbp_migration_tx_hash lags the chain)
  showComplete: boolean
}

/**
 * Decides whether (and how) to show the post-auction migrate CTA.
 * `LBPStrategy.migrate()` is permissionless, so once the migration block is reached the CTA is
 * shown to everyone; before that only the creator (tokensRecipient) sees it, in a disabled
 * state with the countdown. Hidden once migration has run (`lbp_migration_tx_hash` set) —
 * except right after a locally-confirmed migration, where a done state is shown until the
 * API catches up. Old-factory auctions index no migration block and never show the CTA.
 */
export function getMigrateCtaState({
  outcome,
  migration,
  isConnectedTokensRecipient,
  hasLocallyMigrated,
}: {
  outcome: AuctionOutcome
  migration: LbpMigrationState
  isConnectedTokensRecipient: boolean
  hasLocallyMigrated: boolean
}): MigrateCtaState {
  const hidden: MigrateCtaState = { visible: false, enabled: false, showComplete: false }

  if (outcome !== AuctionOutcome.GRADUATED) {
    return hidden
  }
  if (migration.hasMigrated) {
    return hidden
  }
  if (hasLocallyMigrated) {
    return { visible: true, enabled: false, showComplete: true }
  }
  if (migration.canMigrate) {
    return { visible: true, enabled: true, showComplete: false }
  }
  // Pre-migration-block: only the creator sees the (disabled) CTA, and only when a migration
  // block is actually scheduled
  if (isConnectedTokensRecipient && migration.migrationBlock !== undefined) {
    return { visible: true, enabled: false, showComplete: false }
  }
  return hidden
}
