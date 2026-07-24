import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { blockToTimestamp, calibratedBlockToTimestamp } from '~/features/Toucan/Auction/utils/blockToTimestamp'

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
