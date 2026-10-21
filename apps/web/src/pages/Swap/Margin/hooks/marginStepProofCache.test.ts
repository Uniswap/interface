import { logger } from 'utilities/src/logger/logger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetMemoryProofsForTest,
  clearPlanProofs,
  clearStepProof,
  readStepProof,
  writeStepProof,
} from '~/pages/Swap/Margin/hooks/marginStepProofCache'

const SWAPPER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
// Same address, differing casing — proves the key normalizes case (pointer-key parity).
const SWAPPER_LOWER = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
const OTHER_SWAPPER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const HASH = '0xabc123'
const TO = '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64'
const DATA = '0xdeadbeef'

describe('marginStepProofCache', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetMemoryProofsForTest()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('round-trips a written proof (txHash + calldata identity) and clears it', () => {
    expect(readStepProof({ swapper: SWAPPER, planId: 'rt', stepIndex: 0 })).toBeUndefined()
    writeStepProof({ swapper: SWAPPER, planId: 'rt', stepIndex: 0, txHash: HASH, to: TO, data: DATA })
    expect(readStepProof({ swapper: SWAPPER, planId: 'rt', stepIndex: 0 })).toEqual({
      txHash: HASH,
      to: TO,
      data: DATA,
    })
    clearPlanProofs({ swapper: SWAPPER, planId: 'rt' })
    expect(readStepProof({ swapper: SWAPPER, planId: 'rt', stepIndex: 0 })).toBeUndefined()
  })

  // The pre-broadcast dup guard reads the SAME key the broadcast wrote — proving a re-entered loop
  // sees the stored proof and reconciles it instead of re-prompting a second on-chain tx.
  it('pre-broadcast check returns the stored proof for the same step', () => {
    writeStepProof({ swapper: SWAPPER, planId: 'pb', stepIndex: 2, txHash: HASH, to: TO, data: DATA })
    expect(readStepProof({ swapper: SWAPPER, planId: 'pb', stepIndex: 2 })).toEqual({
      txHash: HASH,
      to: TO,
      data: DATA,
    })
  })

  it('keys per swapper / plan / step — no cross-read', () => {
    writeStepProof({ swapper: SWAPPER, planId: 'iso', stepIndex: 1, txHash: HASH, to: TO, data: DATA })
    expect(readStepProof({ swapper: SWAPPER, planId: 'iso', stepIndex: 0 })).toBeUndefined()
    expect(readStepProof({ swapper: SWAPPER, planId: 'iso-b', stepIndex: 1 })).toBeUndefined()
    expect(readStepProof({ swapper: OTHER_SWAPPER, planId: 'iso', stepIndex: 1 })).toBeUndefined()
  })

  it('is swapper-case-insensitive (pointer-key parity)', () => {
    writeStepProof({ swapper: SWAPPER, planId: 'ci', stepIndex: 0, txHash: HASH, to: TO, data: DATA })
    expect(readStepProof({ swapper: SWAPPER_LOWER, planId: 'ci', stepIndex: 0 })).toEqual({
      txHash: HASH,
      to: TO,
      data: DATA,
    })
  })

  it('keeps sibling step proofs when writing another step', () => {
    writeStepProof({ swapper: SWAPPER, planId: 'sib', stepIndex: 0, txHash: '0x0', to: TO, data: DATA })
    writeStepProof({ swapper: SWAPPER, planId: 'sib', stepIndex: 3, txHash: '0x3', to: TO, data: DATA })
    expect(readStepProof({ swapper: SWAPPER, planId: 'sib', stepIndex: 0 })?.txHash).toBe('0x0')
    expect(readStepProof({ swapper: SWAPPER, planId: 'sib', stepIndex: 3 })?.txHash).toBe('0x3')
  })

  it('clearStepProof drops one step but keeps siblings', () => {
    writeStepProof({ swapper: SWAPPER, planId: 'cs', stepIndex: 0, txHash: '0x0', to: TO, data: DATA })
    writeStepProof({ swapper: SWAPPER, planId: 'cs', stepIndex: 1, txHash: '0x1', to: TO, data: DATA })
    clearStepProof({ swapper: SWAPPER, planId: 'cs', stepIndex: 0 })
    expect(readStepProof({ swapper: SWAPPER, planId: 'cs', stepIndex: 0 })).toBeUndefined()
    expect(readStepProof({ swapper: SWAPPER, planId: 'cs', stepIndex: 1 })?.txHash).toBe('0x1')
  })

  // IMPORTANT#2 — the in-memory backup is the SOLE dup guard when localStorage is unavailable (Safari
  // private / quota) within the same session (PATCH-retry-exhausted or a re-entrant loop).
  it('falls back to the in-memory backup when localStorage.setItem throws', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    // Must not throw (would strand the exec lock) and must still be readable this session.
    expect(() =>
      writeStepProof({ swapper: SWAPPER, planId: 'mem-w', stepIndex: 0, txHash: HASH, to: TO, data: DATA }),
    ).not.toThrow()
    expect(readStepProof({ swapper: SWAPPER, planId: 'mem-w', stepIndex: 0 })).toEqual({
      txHash: HASH,
      to: TO,
      data: DATA,
    })
    expect(warn).toHaveBeenCalled()
  })

  it('reads from the in-memory backup when localStorage.getItem throws', () => {
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    writeStepProof({ swapper: SWAPPER, planId: 'mem-r', stepIndex: 0, txHash: HASH, to: TO, data: DATA })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })
    expect(readStepProof({ swapper: SWAPPER, planId: 'mem-r', stepIndex: 0 })).toEqual({
      txHash: HASH,
      to: TO,
      data: DATA,
    })
  })
})
