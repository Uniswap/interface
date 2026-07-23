import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { isQuickLaunchAuction, isQuickLaunchAuctionData } from '~/features/Toucan/utils/quickLaunchAuction'

const ONE_BILLION_RAW = `1${'0'.repeat(27)}`
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function makeEnrichedAuction(overrides: {
  chainId?: number
  currency?: string
  tokenTotalSupply?: string
  totalSupply?: string
  startBlock?: string
  endBlock?: string
}): EnrichedAuction {
  return {
    auction: {
      chainId: overrides.chainId ?? UniverseChainId.Mainnet,
      currency: overrides.currency ?? ZERO_ADDRESS,
      tokenTotalSupply: overrides.tokenTotalSupply ?? ONE_BILLION_RAW,
      totalSupply: overrides.totalSupply ?? ONE_BILLION_RAW,
      // Mainnet: 300 blocks x 12s = 1h
      startBlock: overrides.startBlock ?? '1000',
      endBlock: overrides.endBlock ?? '1300',
    },
  } as unknown as EnrichedAuction
}

describe('isQuickLaunchAuction', () => {
  it('matches the preset fingerprint: native raise, 1B supply, ~1h window', () => {
    expect(isQuickLaunchAuction(makeEnrichedAuction({}))).toBe(true)
  })

  it('accepts the 1h window on chains with different block times', () => {
    // Base: 1800 blocks x 2s = 1h; Sepolia: 300 blocks x 12s = 1h
    expect(isQuickLaunchAuction(makeEnrichedAuction({ chainId: UniverseChainId.Base, endBlock: '2800' }))).toBe(true)
    expect(isQuickLaunchAuction(makeEnrichedAuction({ chainId: UniverseChainId.Sepolia }))).toBe(true)
  })

  it('accepts the 30 min duration preset', () => {
    // Mainnet: 150 blocks x 12s = 30 min
    expect(isQuickLaunchAuction(makeEnrichedAuction({ endBlock: '1150' }))).toBe(true)
    // Base: 900 blocks x 2s = 30 min
    expect(isQuickLaunchAuction(makeEnrichedAuction({ chainId: UniverseChainId.Base, endBlock: '1900' }))).toBe(true)
  })

  it('accepts the 4h duration preset', () => {
    // Mainnet: 1200 blocks x 12s = 4h
    expect(isQuickLaunchAuction(makeEnrichedAuction({ endBlock: '2200' }))).toBe(true)
    // Base: 7200 blocks x 2s = 4h
    expect(isQuickLaunchAuction(makeEnrichedAuction({ chainId: UniverseChainId.Base, endBlock: '8200' }))).toBe(true)
  })

  it('accepts block-time rounding within the ±10% tolerance of a preset', () => {
    // Mainnet: 155 blocks x 12s = 31 min (within 10% of 30 min)
    expect(isQuickLaunchAuction(makeEnrichedAuction({ endBlock: '1155' }))).toBe(true)
    // Mainnet: 1230 blocks x 12s = 4h06 (within 10% of 4h)
    expect(isQuickLaunchAuction(makeEnrichedAuction({ endBlock: '2230' }))).toBe(true)
  })

  it('rejects non-native raises', () => {
    expect(isQuickLaunchAuction(makeEnrichedAuction({ currency: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }))).toBe(
      false,
    )
  })

  it('rejects non-1B supplies', () => {
    expect(isQuickLaunchAuction(makeEnrichedAuction({ tokenTotalSupply: `5${'0'.repeat(26)}` }))).toBe(false)
  })

  it('rejects windows that match none of the duration presets', () => {
    // 600 blocks x 12s = 2h on mainnet — between the 1h and 4h presets
    expect(isQuickLaunchAuction(makeEnrichedAuction({ endBlock: '1600' }))).toBe(false)
    // 15 blocks x 12s = 3min — below the 30 min floor
    expect(isQuickLaunchAuction(makeEnrichedAuction({ endBlock: '1015' }))).toBe(false)
    // 2400 blocks x 12s = 8h — above the 4h ceiling
    expect(isQuickLaunchAuction(makeEnrichedAuction({ endBlock: '3400' }))).toBe(false)
  })

  it('rejects auctions with no core auction data', () => {
    expect(isQuickLaunchAuction({ auction: undefined } as unknown as EnrichedAuction)).toBe(false)
  })
})

describe('isQuickLaunchAuctionData', () => {
  // The detail page passes AuctionDetails (raw auction fields) rather than EnrichedAuction.
  it('matches the preset fingerprint on raw auction fields', () => {
    expect(
      isQuickLaunchAuctionData({
        chainId: UniverseChainId.Mainnet,
        currency: ZERO_ADDRESS,
        tokenTotalSupply: ONE_BILLION_RAW,
        totalSupply: ONE_BILLION_RAW,
        startBlock: '1000',
        endBlock: '1300',
      }),
    ).toBe(true)
  })

  it('rejects non-matching raw auction fields', () => {
    expect(
      isQuickLaunchAuctionData({
        chainId: UniverseChainId.Mainnet,
        currency: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        tokenTotalSupply: ONE_BILLION_RAW,
        totalSupply: ONE_BILLION_RAW,
        startBlock: '1000',
        endBlock: '1300',
      }),
    ).toBe(false)
  })
})
