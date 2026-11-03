import { UniverseChainId } from '@universe/chains'
import { blockSpanMs, blockToTimestamp, calibratedBlockToTimestamp } from '~/utils/blockToTimestamp'

// Mainnet blockTimeMs = 12000
const chainId = UniverseChainId.Mainnet
const anchorBlock = 100
const anchorTime = new Date('2025-01-01T00:00:00Z')

describe('blockToTimestamp', () => {
  it('extrapolates from the anchor using the chain-constant block time', () => {
    const result = blockToTimestamp({ block: 200, anchorBlock, anchorTime, chainId })
    expect(result.getTime()).toBe(anchorTime.getTime() + 100 * 12_000)
  })
})

describe('calibratedBlockToTimestamp', () => {
  // 100 blocks in 100s → 1000ms per block (vs the 12000ms chain constant)
  const currentBlock = 200
  const currentTime = new Date(anchorTime.getTime() + 100_000)

  it('interpolates between the anchor and the live block', () => {
    const result = calibratedBlockToTimestamp({
      block: 150,
      anchorBlock,
      anchorTime,
      chainId,
      currentBlock,
      currentTime,
    })
    expect(result.getTime()).toBe(anchorTime.getTime() + 50_000)
  })

  it('maps the live block exactly to the live time', () => {
    const result = calibratedBlockToTimestamp({
      block: 200,
      anchorBlock,
      anchorTime,
      chainId,
      currentBlock,
      currentTime,
    })
    expect(result.getTime()).toBe(currentTime.getTime())
  })

  it('extrapolates past the live block at the calibrated rate', () => {
    const result = calibratedBlockToTimestamp({
      block: 300,
      anchorBlock,
      anchorTime,
      chainId,
      currentBlock,
      currentTime,
    })
    expect(result.getTime()).toBe(anchorTime.getTime() + 200_000)
  })

  it('falls back to the chain constant when no live block is provided', () => {
    const result = calibratedBlockToTimestamp({ block: 200, anchorBlock, anchorTime, chainId })
    expect(result.getTime()).toBe(anchorTime.getTime() + 100 * 12_000)
  })

  it('falls back to the chain constant when the live block is not past the anchor', () => {
    const result = calibratedBlockToTimestamp({
      block: 200,
      anchorBlock,
      anchorTime,
      chainId,
      currentBlock: anchorBlock,
      currentTime,
    })
    expect(result.getTime()).toBe(anchorTime.getTime() + 100 * 12_000)
  })

  it('falls back to the chain constant when the live time is not past the anchor time', () => {
    const result = calibratedBlockToTimestamp({
      block: 200,
      anchorBlock,
      anchorTime,
      chainId,
      currentBlock,
      currentTime: anchorTime,
    })
    expect(result.getTime()).toBe(anchorTime.getTime() + 100 * 12_000)
  })
})

// Base Denim: block 53,556,127 is the first 200ms block, at unix 1793901601; 2s blocks before it.
// Expected values below are hand-computed literals, deliberately not derived from the SDK schedule.
const BASE_DENIM_BLOCK = 53_556_127
const BASE_DENIM_MS = 1_793_901_601_000

describe('blockSpanMs', () => {
  it('uses the chain-constant block time on chains without a schedule', () => {
    expect(blockSpanMs({ chainId: UniverseChainId.Mainnet, fromBlock: 100, toBlock: 110 })).toBe(120_000)
  })

  it('keeps 2s blocks for a Base span entirely before Denim', () => {
    expect(
      blockSpanMs({
        chainId: UniverseChainId.Base,
        fromBlock: BASE_DENIM_BLOCK - 110,
        toBlock: BASE_DENIM_BLOCK - 100,
      }),
    ).toBe(20_000)
  })

  it('follows the 2s → 200ms schedule for a Base span crossing Denim', () => {
    // 100 blocks × 2s + 50 blocks × 0.2s
    expect(
      blockSpanMs({ chainId: UniverseChainId.Base, fromBlock: BASE_DENIM_BLOCK - 100, toBlock: BASE_DENIM_BLOCK + 50 }),
    ).toBe(210_000)
    expect(
      blockSpanMs({ chainId: UniverseChainId.Base, fromBlock: BASE_DENIM_BLOCK + 50, toBlock: BASE_DENIM_BLOCK - 100 }),
    ).toBe(-210_000)
  })

  it('returns NaN instead of throwing for an unparsed block on a scheduled chain', () => {
    expect(blockSpanMs({ chainId: UniverseChainId.Base, fromBlock: Number.NaN, toBlock: BASE_DENIM_BLOCK })).toBeNaN()
  })

  it('falls back to the default L2 block time without a chain', () => {
    expect(blockSpanMs({ chainId: undefined, fromBlock: 0, toBlock: 10 })).toBe(30_000)
  })
})

describe('Base Denim block → time', () => {
  it('blockToTimestamp converts across the cadence change', () => {
    const result = blockToTimestamp({
      block: BASE_DENIM_BLOCK + 50,
      anchorBlock: BASE_DENIM_BLOCK - 100,
      anchorTime: new Date(BASE_DENIM_MS - 200_000),
      chainId: UniverseChainId.Base,
    })
    expect(result.getTime()).toBe(1_793_901_611_000)
  })

  it('calibratedBlockToTimestamp converts from the anchor along the schedule, not an averaged rate', () => {
    // Averaging the anchor → live span (1000 × 2s + 100 × 0.2s over 1100 blocks) would put block
    // +600 ~15 minutes late; the schedule puts it 500 × 0.2s after the live block.
    const result = calibratedBlockToTimestamp({
      block: BASE_DENIM_BLOCK + 600,
      anchorBlock: BASE_DENIM_BLOCK - 1000,
      anchorTime: new Date(BASE_DENIM_MS - 2_000_000),
      chainId: UniverseChainId.Base,
      currentBlock: BASE_DENIM_BLOCK + 100,
      currentTime: new Date(BASE_DENIM_MS + 20_000),
    })
    expect(result.getTime()).toBe(1_793_901_721_000)
  })

  it('calibratedBlockToTimestamp ignores a stale live block paired with wall-clock time', () => {
    // Live block +100 is really at Denim + 20s, but observed 30s later; the anchor along the
    // schedule (1000 × 2s + 600 × 0.2s) still puts block +600 at Denim + 120s.
    const result = calibratedBlockToTimestamp({
      block: BASE_DENIM_BLOCK + 600,
      anchorBlock: BASE_DENIM_BLOCK - 1000,
      anchorTime: new Date(BASE_DENIM_MS - 2_000_000),
      chainId: UniverseChainId.Base,
      currentBlock: BASE_DENIM_BLOCK + 100,
      currentTime: new Date(BASE_DENIM_MS + 50_000),
    })
    expect(result.getTime()).toBe(1_793_901_721_000)
  })
})
