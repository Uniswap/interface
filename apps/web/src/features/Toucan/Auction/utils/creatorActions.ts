/**
 * Pure state helpers for the auction creator's post-auction actions:
 * - `sweepUnsoldTokens()` — only the auction's `tokensRecipient` may call it, only after the end
 *   block, one-shot (`sweepUnsoldTokensBlock != 0` afterwards). Returns the full deposited supply
 *   on a failed launch, or the unsold remainder on a graduated one.
 * - `LBPStrategy.migrate(auction)` — permissionless success-path migration, allowed once
 *   `lbpMigrationBlock` is reached, one-shot (`lbpMigrationTxHash` set afterwards).
 */
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

/**
 * Whether the connected wallet is the auction's tokensRecipient — the only address allowed to
 * call `sweepUnsoldTokens()`. Case-insensitive address comparison.
 */
export function isTokensRecipient({
  connectedAddress,
  tokensRecipient,
}: {
  connectedAddress: string | undefined
  tokensRecipient: string | undefined
}): boolean {
  if (!connectedAddress || !tokensRecipient) {
    return false
  }
  return areAddressesEqual({
    addressInput1: { address: connectedAddress, platform: Platform.EVM },
    addressInput2: { address: tokensRecipient, platform: Platform.EVM },
  })
}

/**
 * Whether the creator already swept unsold tokens. `sweepUnsoldTokensBlock()` is a one-shot
 * latch: 0 until swept, then the sweep block. Returns undefined while the chain read is pending.
 */
export function hasSweptUnsoldTokens(sweepUnsoldTokensBlock: string | undefined): boolean | undefined {
  if (sweepUnsoldTokensBlock === undefined) {
    return undefined
  }
  try {
    return BigInt(sweepUnsoldTokensBlock) !== 0n
  } catch {
    return undefined
  }
}

export interface LbpMigrationState {
  // lbpMigrationTxHash is set once `migrate()` has run
  hasMigrated: boolean
  // The scheduled block at which `migrate()` becomes callable, if known
  migrationBlock: number | undefined
  // currentBlock has reached migrationBlock (false while either is unknown)
  isMigrationBlockReached: boolean
  // `migrate()` can be sent right now: strategy known, not yet migrated, migration block reached
  canMigrate: boolean
}

/**
 * Derives the LBP migration state from data-api fields (`lbp_migration_block` /
 * `lbp_migration_tx_hash` / `lbp_strategy_address`) and the current block.
 * Old-factory LBP auctions have no migration block indexed; they never become migratable here.
 */
export function getLbpMigrationState({
  lbpStrategyAddress,
  lbpMigrationBlock,
  lbpMigrationTxHash,
  currentBlockNumber,
}: {
  lbpStrategyAddress: string | undefined
  lbpMigrationBlock: string | undefined
  lbpMigrationTxHash: string | undefined
  currentBlockNumber: number | undefined
}): LbpMigrationState {
  const hasMigrated = Boolean(lbpMigrationTxHash)
  const migrationBlock =
    lbpMigrationBlock !== undefined && lbpMigrationBlock !== '' ? Number(lbpMigrationBlock) : undefined
  const isMigrationBlockReached =
    migrationBlock !== undefined &&
    Number.isFinite(migrationBlock) &&
    currentBlockNumber !== undefined &&
    currentBlockNumber >= migrationBlock

  return {
    hasMigrated,
    migrationBlock,
    isMigrationBlockReached,
    canMigrate: Boolean(lbpStrategyAddress) && !hasMigrated && isMigrationBlockReached,
  }
}
