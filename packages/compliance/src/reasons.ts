import { RestrictionReason } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'

/**
 * Region-specific hard blocks owned by the geo-restriction UX. No user action clears them, and
 * per the proto contract they never co-occur with the acknowledgement reasons on a single token,
 * so `isHardBlocked` and `isAckGated` are mutually exclusive.
 *
 * `UNSPECIFIED` is intentionally excluded: it is the generic "unsupported token" catch-all (the
 * folded-in legacy `UNSUPPORTED`) with no region semantics, so it is left to the standard
 * blocked-token UX rather than the geo-restriction UX.
 */
const HARD_BLOCK_REASONS: ReadonlySet<RestrictionReason> = new Set([
  RestrictionReason.DERIVATIVE,
  RestrictionReason.PERMISSIONLESS_SECURITY,
])

/** Every reason this client models. Anything outside this set is a future category. */
const KNOWN_REASONS: ReadonlySet<RestrictionReason> = new Set([
  RestrictionReason.UNSPECIFIED,
  RestrictionReason.DERIVATIVE,
  RestrictionReason.PERMISSIONLESS_SECURITY,
  RestrictionReason.REQUIRES_ACKNOWLEDGEMENT,
  RestrictionReason.ACKNOWLEDGED,
])

export function isHardBlocked(reasons: RestrictionReason[]): boolean {
  return reasons.some((reason) => HARD_BLOCK_REASONS.has(reason))
}

export function requiresAcknowledgement(reasons: RestrictionReason[]): boolean {
  return reasons.includes(RestrictionReason.REQUIRES_ACKNOWLEDGEMENT)
}

export function isAcknowledged(reasons: RestrictionReason[]): boolean {
  return reasons.includes(RestrictionReason.ACKNOWLEDGED)
}

/**
 * A token on the acknowledgement path, in either state: the geo card/modal
 * should show and the swap button should not hard-block (it gates on the
 * attestation instead).
 */
export function isAckGated(reasons: RestrictionReason[]): boolean {
  return requiresAcknowledgement(reasons) || isAcknowledged(reasons)
}

/**
 * True when a token carries a reason this client does not model yet (a future `RestrictionReason`
 * category). Callers should fail safe and treat it as gated rather than tradeable.
 */
export function hasUnrecognizedReason(reasons: RestrictionReason[]): boolean {
  return reasons.some((reason) => !KNOWN_REASONS.has(reason))
}
