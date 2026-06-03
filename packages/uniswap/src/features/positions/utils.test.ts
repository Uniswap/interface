import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getFeeLabel, getPositionKey, getProtocolVersionLabel } from 'uniswap/src/features/positions/utils'
import { describe, expect, it } from 'vitest'

describe('getPositionKey', () => {
  it('joins poolId, tokenId, and chainId with dashes', () => {
    expect(
      getPositionKey({
        poolId: '0xpool',
        tokenId: '1234',
        chainId: UniverseChainId.Mainnet,
      } as Pick<PositionInfo, 'poolId' | 'tokenId' | 'chainId'>),
    ).toBe(`0xpool-1234-${UniverseChainId.Mainnet}`)
  })

  it('coerces a missing V2 tokenId to empty string', () => {
    expect(
      getPositionKey({
        poolId: '0xpool',
        tokenId: undefined,
        chainId: UniverseChainId.Base,
      } as Pick<PositionInfo, 'poolId' | 'tokenId' | 'chainId'>),
    ).toBe(`0xpool--${UniverseChainId.Base}`)
  })
})

describe('getProtocolVersionLabel', () => {
  it('returns lowercase version strings for V2/V3/V4', () => {
    expect(getProtocolVersionLabel(ProtocolVersion.V2)).toBe('v2')
    expect(getProtocolVersionLabel(ProtocolVersion.V3)).toBe('v3')
    expect(getProtocolVersionLabel(ProtocolVersion.V4)).toBe('v4')
  })

  it('returns undefined for UNSPECIFIED', () => {
    expect(getProtocolVersionLabel(ProtocolVersion.UNSPECIFIED)).toBeUndefined()
  })

  // Sanity check the function gracefully handles enum members it doesn't know about — the
  // upstream proto can add new versions before we update this switch.
  it('returns undefined for an unknown ProtocolVersion value', () => {
    expect(getProtocolVersionLabel(999 as ProtocolVersion)).toBeUndefined()
  })
})

describe('getFeeLabel', () => {
  const dynamicLabel = 'Dynamic'

  it('returns the dynamic label when feeTier.isDynamic is true', () => {
    expect(
      getFeeLabel({
        version: ProtocolVersion.V4,
        feeTier: { feeAmount: 8388608, tickSpacing: 60, isDynamic: true },
        dynamicLabel,
      }),
    ).toBe('Dynamic')
  })

  it('formats a static feeTier as a percentage of BIPS_BASE', () => {
    // 500 / 10_000 = 0.05 → "0.05%"
    expect(
      getFeeLabel({
        version: ProtocolVersion.V3,
        feeTier: { feeAmount: 500, tickSpacing: 10, isDynamic: false },
        dynamicLabel,
      }),
    ).toBe('0.05%')

    // 3000 / 10_000 = 0.3 → "0.3%"
    expect(
      getFeeLabel({
        version: ProtocolVersion.V4,
        feeTier: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
        dynamicLabel,
      }),
    ).toBe('0.3%')
  })

  it('falls back to the V2 default fee tier when feeTier is missing on V2', () => {
    // V2_DEFAULT_FEE_TIER = 3000 → "0.3%"
    expect(getFeeLabel({ version: ProtocolVersion.V2, dynamicLabel })).toBe('0.3%')
  })

  it('returns undefined when feeTier is missing on V3/V4', () => {
    expect(getFeeLabel({ version: ProtocolVersion.V3, dynamicLabel })).toBeUndefined()
    expect(getFeeLabel({ version: ProtocolVersion.V4, dynamicLabel })).toBeUndefined()
  })
})
