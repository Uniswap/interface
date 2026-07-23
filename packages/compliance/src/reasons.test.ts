import { RestrictionReason } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import {
  hasUnrecognizedReason,
  isAckGated,
  isAcknowledged,
  isHardBlocked,
  requiresAcknowledgement,
} from '@universe/compliance/src/reasons'
import { describe, expect, it } from 'vitest'

const ALL_REASONS: RestrictionReason[] = [
  RestrictionReason.UNSPECIFIED,
  RestrictionReason.DERIVATIVE,
  RestrictionReason.PERMISSIONLESS_SECURITY,
  RestrictionReason.REQUIRES_ACKNOWLEDGEMENT,
  RestrictionReason.ACKNOWLEDGED,
]

describe(isHardBlocked, () => {
  it('is true for each region-specific hard-block reason', () => {
    expect(isHardBlocked([RestrictionReason.DERIVATIVE])).toBe(true)
    expect(isHardBlocked([RestrictionReason.PERMISSIONLESS_SECURITY])).toBe(true)
  })

  it('is false for UNSPECIFIED, acknowledgement reasons, and the empty set', () => {
    // UNSPECIFIED is the generic unsupported-token catch-all, left to the standard
    // blocked-token UX rather than the geo-restriction hard block.
    expect(isHardBlocked([RestrictionReason.UNSPECIFIED])).toBe(false)
    expect(isHardBlocked([RestrictionReason.REQUIRES_ACKNOWLEDGEMENT])).toBe(false)
    expect(isHardBlocked([RestrictionReason.ACKNOWLEDGED])).toBe(false)
    expect(isHardBlocked([])).toBe(false)
  })
})

describe(requiresAcknowledgement, () => {
  it('is true only for REQUIRES_ACKNOWLEDGEMENT', () => {
    expect(requiresAcknowledgement([RestrictionReason.REQUIRES_ACKNOWLEDGEMENT])).toBe(true)
    expect(requiresAcknowledgement([RestrictionReason.ACKNOWLEDGED])).toBe(false)
    expect(requiresAcknowledgement([RestrictionReason.DERIVATIVE])).toBe(false)
    expect(requiresAcknowledgement([])).toBe(false)
  })
})

describe(isAcknowledged, () => {
  it('is true only for ACKNOWLEDGED', () => {
    expect(isAcknowledged([RestrictionReason.ACKNOWLEDGED])).toBe(true)
    expect(isAcknowledged([RestrictionReason.REQUIRES_ACKNOWLEDGEMENT])).toBe(false)
    expect(isAcknowledged([])).toBe(false)
  })
})

describe(isAckGated, () => {
  it('is true for either acknowledgement state', () => {
    expect(isAckGated([RestrictionReason.REQUIRES_ACKNOWLEDGEMENT])).toBe(true)
    expect(isAckGated([RestrictionReason.ACKNOWLEDGED])).toBe(true)
  })

  it('is false for hard blocks and the empty set', () => {
    expect(isAckGated([RestrictionReason.DERIVATIVE])).toBe(false)
    expect(isAckGated([])).toBe(false)
  })
})

describe(hasUnrecognizedReason, () => {
  it('is false for reasons this client models', () => {
    expect(hasUnrecognizedReason([RestrictionReason.DERIVATIVE])).toBe(false)
    expect(hasUnrecognizedReason(ALL_REASONS)).toBe(false)
  })

  it('is true for a reason outside the modeled enum (a future proto category)', () => {
    // Simulate a RestrictionReason value added to the proto but not yet modeled here.
    const futureReason = 9999 as RestrictionReason
    expect(hasUnrecognizedReason([futureReason])).toBe(true)
    expect(hasUnrecognizedReason([RestrictionReason.DERIVATIVE, futureReason])).toBe(true)
  })

  it('is false for the empty set', () => {
    expect(hasUnrecognizedReason([])).toBe(false)
  })
})

describe('hard-block / ack-gated partition', () => {
  it('never classifies a single reason as both hard-blocked and ack-gated', () => {
    for (const reason of ALL_REASONS) {
      expect(isHardBlocked([reason]) && isAckGated([reason])).toBe(false)
    }
  })
})
