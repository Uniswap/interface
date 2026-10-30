import { ARC_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/arc'

// Mean ms/block from block timestamps over the trailing 1M–5M blocks (two public RPCs,
// 2026-10-20). Arc timestamps are whole seconds, so only long spans resolve the rate.
const MEASURED_ARC_BLOCK_TIME_MS = 507.9

describe('ARC_CHAIN_INFO.blockTimeMs', () => {
  // Block → time estimates (auction closes, countdowns) may land late, never early: an
  // early one offers an action the chain still refuses at that block.
  it('sits at or just above the measured block time', () => {
    expect(ARC_CHAIN_INFO.blockTimeMs).toBeGreaterThanOrEqual(MEASURED_ARC_BLOCK_TIME_MS)
    expect(ARC_CHAIN_INFO.blockTimeMs).toBeLessThanOrEqual(MEASURED_ARC_BLOCK_TIME_MS * 1.01)
  })

  // Callers multiply it as a BigInt, which throws on a fractional value.
  it('is a whole number of milliseconds', () => {
    expect(Number.isInteger(ARC_CHAIN_INFO.blockTimeMs)).toBe(true)
  })
})
