import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Position as LiquidityServicePosition } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { parseLiquidityServicePosition } from 'uniswap/src/features/positions/parseLiquidityServicePosition'
import {
  liquidityServiceProtocolsToProtocolVersion,
  normalizeLiquidityServiceProtocols,
  protocolVersionToLiquidityServiceProtocols,
} from 'uniswap/src/features/positions/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLoggerWarn, mockLoggerError } = vi.hoisted(() => ({
  mockLoggerWarn: vi.fn(),
  mockLoggerError: vi.fn(),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: mockLoggerWarn,
    error: mockLoggerError,
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// ---------- Fixtures ----------

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // 6 decimals, sorts before WETH
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const V3_POOL_ADDRESS = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
const V2_PAIR_ADDRESS = '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc'
const V4_POOL_ID = '0x' + 'ab'.repeat(32)
const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
// Base-chain reward token, so a campaign's chain can be told apart from the position's.
const MORPHO = '0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842'
const HOOK_ADDRESS = '0x0000000000000000000000000000000000000abc'
const OWNER = '0x0000000000000000000000000000000000000123'
// sqrtPriceX96 at tick 0.
const SQRT_PRICE_TICK_0 = '79228162514264337593543950336'

const usdcMetadata = { symbol: 'USDC', name: 'USD Coin', decimals: 6 }
const wethMetadata = { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 }

function lsPosition(overrides: Record<string, unknown>): LiquidityServicePosition {
  return {
    chainId: 1,
    owner: OWNER,
    updatedAt: BigInt(1718000001),
    createdAt: BigInt(1718000000),
    ...overrides,
  } as unknown as LiquidityServicePosition
}

/** Fully enriched V3 position (token identity + pool state + USD prices), in range. */
function enrichedV3Position(overrides: Record<string, unknown> = {}): LiquidityServicePosition {
  return lsPosition({
    version: Protocols.V3,
    poolAddressOrId: V3_POOL_ADDRESS,
    tokenId: '123',
    feeTier: 500,
    tickSpacing: 10,
    tickLower: -100,
    tickUpper: 100,
    liquidity: '2000000000',
    token0Address: USDC,
    token1Address: WETH,
    token0Metadata: usdcMetadata,
    token1Metadata: wethMetadata,
    currentTick: 0,
    sqrtPriceX96: SQRT_PRICE_TICK_0,
    poolLiquidity: '2000000000',
    token0PriceUsd: '1',
    token1PriceUsd: '2000',
    ...overrides,
  })
}

/** Raw-only V3 position: pool metadata enrichment missing (no token identity, no pool state). */
function degradedV3Position(overrides: Record<string, unknown> = {}): LiquidityServicePosition {
  return lsPosition({
    version: Protocols.V3,
    poolAddressOrId: V3_POOL_ADDRESS,
    tokenId: '456',
    feeTier: 3000,
    tickSpacing: 60,
    tickLower: -60,
    tickUpper: 60,
    liquidity: '777',
    ...overrides,
  })
}

function enrichedV2Position(overrides: Record<string, unknown> = {}): LiquidityServicePosition {
  return lsPosition({
    version: Protocols.V2,
    poolAddressOrId: V2_PAIR_ADDRESS,
    lpShares: '5000',
    // Wallet owns half the pool (5000 / 10000), so underlying = half of each reserve.
    totalSupply: '10000',
    reserve0: '2000000',
    reserve1: '1000000000000000000',
    token0Address: USDC,
    token1Address: WETH,
    token0Metadata: usdcMetadata,
    token1Metadata: wethMetadata,
    token0PriceUsd: '1',
    token1PriceUsd: '2000',
    ...overrides,
  })
}

describe('parseLiquidityServicePosition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enriched happy path', () => {
    it('maps an in-range V3 position with SDK pool/position, currencies from metadata, and USD value', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position())

      expect(parsed).toBeDefined()
      expect(parsed?.version).toBe(ProtocolVersion.V3)
      expect(parsed?.status).toBe(PositionStatus.IN_RANGE)
      expect(parsed?.chainId).toBe(1)
      expect(parsed?.poolId).toBe(V3_POOL_ADDRESS)
      expect(parsed?.tokenId).toBe('123')
      expect(parsed?.tickLower).toBe(-100)
      expect(parsed?.tickUpper).toBe(100)
      expect(parsed?.liquidity).toBe('2000000000')
      expect(parsed?.poolOrPair).toBeDefined()
      expect(parsed && 'position' in parsed ? parsed.position : undefined).toBeDefined()
      expect(parsed?.currency0Amount.currency.symbol).toBe('USDC')
      expect(parsed?.currency1Amount.currency.symbol).toBe('WETH')
      // In range around the current tick, both underlying amounts are non-zero.
      expect(Number(parsed?.currency0Amount.toExact())).toBeGreaterThan(0)
      expect(Number(parsed?.currency1Amount.toExact())).toBeGreaterThan(0)
      // USD value = amount0 * $1 + amount1 * $2000.
      expect(parsed?.totalValueUsd).toBeGreaterThan(0)
      // created_at (unix seconds) is carried through as a number for the Created column.
      expect(parsed?.createdAt).toBe(1718000000)
      expect(mockLoggerWarn).not.toHaveBeenCalled()
    })

    it('carries created_at 0 through as 0 (indexer has no creation event yet)', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ createdAt: BigInt(0) }))

      expect(parsed?.createdAt).toBe(0)
    })

    it('leaves createdAt undefined — not NaN — when the field is absent', () => {
      // Once the proto makes created_at optional it arrives as undefined; it must not become
      // Number(undefined) === NaN, which would break createdAt equality checks downstream.
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ createdAt: undefined }))

      expect(parsed?.createdAt).toBeUndefined()
    })

    it('carries a string-rehydrated createdAt through (protobuf-JSON encodes int64 as a string)', () => {
      // A cache-restored (persisted-query) load rehydrates int64 as a string, mirroring the status
      // name-rehydration above; the guard must accept it, not drop the Created column to undefined.
      const parsed = parseLiquidityServicePosition(
        enrichedV3Position({ createdAt: '1718000000' } as unknown as Record<string, unknown>),
      )

      expect(parsed?.createdAt).toBe(1718000000)
    })

    it('maps pool_stats fee APRs, using the 24h window (apr1d) as the headline apr', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ apr1d: 12.5, apr7d: 9.25, apr30d: 7.75 }))

      // The 24h window feeds both the headline apr and the tooltip's 24H row.
      expect(parsed?.apr).toBe(12.5)
      expect(parsed?.apr1d).toBe(12.5)
      expect(parsed?.apr7d).toBe(9.25)
      expect(parsed?.apr30d).toBe(7.75)
    })

    it('leaves APRs unset when pool_stats has no values for the pool', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position())

      expect(parsed?.apr).toBeUndefined()
      expect(parsed?.apr1d).toBeUndefined()
      expect(parsed?.apr7d).toBeUndefined()
      expect(parsed?.apr30d).toBeUndefined()
      expect(parsed?.totalApr).toBeUndefined()
    })

    it('carries the backend-summed total APR rather than summing on the client', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ apr1d: 12.5, totalApr: 17 }))

      // Served directly, not apr + reward boost recomputed here.
      expect(parsed?.totalApr).toBe(17)
    })

    it('derives OUT_OF_RANGE when the current tick is outside the position range', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ tickLower: 100, tickUpper: 200 }))

      expect(parsed?.status).toBe(PositionStatus.OUT_OF_RANGE)
    })

    it('derives CLOSED when position liquidity is zero', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ liquidity: '0' }))

      expect(parsed?.status).toBe(PositionStatus.CLOSED)
    })

    it('maps a V4 position with its hook address and pool id', () => {
      const parsed = parseLiquidityServicePosition(
        enrichedV3Position({
          version: Protocols.V4,
          poolAddressOrId: V4_POOL_ID,
          hookAddress: HOOK_ADDRESS,
        }),
      )

      expect(parsed?.version).toBe(ProtocolVersion.V4)
      expect(parsed?.poolId).toBe(V4_POOL_ID)
      expect(parsed && 'v4hook' in parsed ? parsed.v4hook : undefined).toBe(HOOK_ADDRESS)
      expect(parsed?.poolOrPair).toBeDefined()
      expect(parsed?.totalValueUsd).toBeGreaterThan(0)
    })

    it('normalizes a string-rehydrated protobuf version enum', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ version: 'V3' }))

      expect(parsed?.version).toBe(ProtocolVersion.V3)
    })
  })

  describe('permissioned V4 positions', () => {
    const mainnetAddresses = CHAIN_TO_ADDRESSES_MAP[1]
    const permissionedManager = mainnetAddresses.permissionedV4PositionManagerAddress
    const canonicalManager = mainnetAddresses.v4PositionManagerAddress

    function v4Position(overrides: Record<string, unknown> = {}): LiquidityServicePosition {
      return enrichedV3Position({
        version: Protocols.V4,
        poolAddressOrId: V4_POOL_ID,
        hookAddress: HOOK_ADDRESS,
        ...overrides,
      })
    }

    it('flags isPermissioned when the manager is the chain permissioned V4 PositionManager, regardless of address case', () => {
      const parsed = parseLiquidityServicePosition(
        v4Position({ positionManagerAddress: permissionedManager?.toUpperCase().replace('0X', '0x') }),
      )

      expect(permissionedManager).toBeDefined()
      expect(parsed?.version).toBe(ProtocolVersion.V4)
      expect(parsed && 'isPermissioned' in parsed ? parsed.isPermissioned : undefined).toBe(true)
    })

    it('does not flag a position held by the canonical V4 PositionManager', () => {
      const parsed = parseLiquidityServicePosition(v4Position({ positionManagerAddress: canonicalManager }))

      expect(parsed && 'isPermissioned' in parsed ? parsed.isPermissioned : undefined).toBe(false)
    })

    it('does not flag when the manager address is unset', () => {
      const parsed = parseLiquidityServicePosition(v4Position())

      expect(parsed && 'isPermissioned' in parsed ? parsed.isPermissioned : undefined).toBe(false)
    })

    it('does not flag on a chain without a permissioned V4 PositionManager deployment', () => {
      const parsed = parseLiquidityServicePosition(
        v4Position({ chainId: 8453, positionManagerAddress: permissionedManager }),
      )

      expect(parsed && 'isPermissioned' in parsed ? parsed.isPermissioned : undefined).toBe(false)
    })
  })

  describe('V2 positions', () => {
    it('derives underlying token amounts and USD value from reserves, totalSupply, and lpShares', () => {
      const parsed = parseLiquidityServicePosition(enrichedV2Position())

      expect(parsed?.version).toBe(ProtocolVersion.V2)
      expect(parsed?.status).toBe(PositionStatus.IN_RANGE)
      expect(parsed?.poolId).toBe(V2_PAIR_ADDRESS)
      expect(parsed?.poolOrPair).toBeDefined()
      expect(parsed?.liquidityAmount?.quotient.toString()).toBe('5000')
      expect(parsed?.totalSupply?.quotient.toString()).toBe('10000')
      // Wallet owns half the pool: 1 USDC + 0.5 WETH.
      expect(parsed?.currency0Amount.toExact()).toBe('1')
      expect(parsed?.currency1Amount.toExact()).toBe('0.5')
      expect(parsed?.currency0Amount.currency.symbol).toBe('USDC')
      // 1 USDC * $1 + 0.5 WETH * $2000.
      expect(parsed?.totalValueUsd).toBe(1001)
    })

    it('leaves underlying amounts zero when reserves/totalSupply are not served', () => {
      const parsed = parseLiquidityServicePosition(
        enrichedV2Position({ reserve0: undefined, reserve1: undefined, totalSupply: undefined }),
      )

      expect(parsed?.poolOrPair).toBeUndefined()
      expect(parsed?.currency0Amount.toExact()).toBe('0')
      expect(parsed?.currency1Amount.toExact()).toBe('0')
      expect(parsed?.totalValueUsd).toBeUndefined()
    })

    it('derives CLOSED and zero underlying for a fully exited V2 position (lpShares zero)', () => {
      const parsed = parseLiquidityServicePosition(enrichedV2Position({ lpShares: '0' }))

      expect(parsed?.status).toBe(PositionStatus.CLOSED)
      expect(parsed?.currency0Amount.toExact()).toBe('0')
      expect(parsed?.currency1Amount.toExact()).toBe('0')
      expect(parsed?.totalValueUsd).toBe(0)
    })
  })

  describe('missing-pool-metadata fallback (degraded rows)', () => {
    it('never drops a V3 position whose pool metadata is unresolved: emits a degraded row from raw fields', () => {
      const parsed = parseLiquidityServicePosition(degradedV3Position())

      expect(parsed).toBeDefined()
      // Raw indexed fields are preserved.
      expect(parsed?.version).toBe(ProtocolVersion.V3)
      expect(parsed?.chainId).toBe(1)
      expect(parsed?.poolId).toBe(V3_POOL_ADDRESS)
      expect(parsed?.tokenId).toBe('456')
      expect(parsed?.tickLower).toBe(-60)
      expect(parsed?.tickUpper).toBe(60)
      expect(parsed?.liquidity).toBe('777')
      // Enrichment-dependent fields are unset ("–" rendering path), not fabricated.
      expect(parsed?.poolOrPair).toBeUndefined()
      expect(parsed && 'position' in parsed ? parsed.position : undefined).toBeUndefined()
      expect(parsed?.totalValueUsd).toBeUndefined()
      expect(parsed?.currency0Amount.toExact()).toBe('0')
      expect(parsed?.currency1Amount.toExact()).toBe('0')
      // Pool state is unknown, so range status is UNSPECIFIED (not a fake in/out verdict).
      expect(parsed?.status).toBe(PositionStatus.UNSPECIFIED)
      // Placeholder currencies are distinct so the pair never compares equal.
      expect(parsed?.currency0Amount.currency.equals(parsed.currency1Amount.currency)).toBe(false)
      expect(mockLoggerWarn).toHaveBeenCalledTimes(1)
    })

    it('never drops a V2 position whose pool metadata is unresolved and still derives status from lpShares', () => {
      const open = parseLiquidityServicePosition(
        lsPosition({ version: Protocols.V2, poolAddressOrId: V2_PAIR_ADDRESS, lpShares: '10' }),
      )
      const closed = parseLiquidityServicePosition(
        lsPosition({ version: Protocols.V2, poolAddressOrId: V2_PAIR_ADDRESS, lpShares: '0' }),
      )

      expect(open?.status).toBe(PositionStatus.IN_RANGE)
      expect(open?.liquidityAmount?.quotient.toString()).toBe('10')
      expect(closed?.status).toBe(PositionStatus.CLOSED)
      expect(open?.totalValueUsd).toBeUndefined()
    })

    it('does not compute a bogus $0 USD value when prices are present but token identity is not', () => {
      const parsed = parseLiquidityServicePosition(degradedV3Position({ token0PriceUsd: '1', token1PriceUsd: '2000' }))

      expect(parsed).toBeDefined()
      expect(parsed?.totalValueUsd).toBeUndefined()
    })

    it('falls back to a degraded row when only one token side is resolved', () => {
      const parsed = parseLiquidityServicePosition(
        degradedV3Position({ token0Address: USDC, token0Metadata: usdcMetadata }),
      )

      expect(parsed).toBeDefined()
      expect(parsed?.currency0Amount.currency.symbol).toBe('USDC')
      expect(parsed?.poolOrPair).toBeUndefined()
      expect(parsed?.totalValueUsd).toBeUndefined()
    })
  })

  describe('uncollected fees', () => {
    // 2.5 USDC (6 decimals) and 0.001 WETH (18 decimals) in raw units.
    const feeOverrides = {
      token0UncollectedFees: '2500000',
      token1UncollectedFees: '1000000000000000',
      uncollectedFeesUsd: 4.5,
    }

    it('maps served fee fields onto a V3 position', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position(feeOverrides))

      expect(parsed?.token0UncollectedFees).toBe('2500000')
      expect(parsed?.token1UncollectedFees).toBe('1000000000000000')
      expect(parsed?.fee0Amount?.toExact()).toBe('2.5')
      expect(parsed?.fee0Amount?.currency.symbol).toBe('USDC')
      expect(parsed?.fee1Amount?.toExact()).toBe('0.001')
      expect(parsed?.fee1Amount?.currency.symbol).toBe('WETH')
      expect(parsed?.uncollectedFeesUsd).toBe(4.5)
    })

    it('maps served fee fields onto a V4 position', () => {
      const parsed = parseLiquidityServicePosition(
        enrichedV3Position({ version: Protocols.V4, poolAddressOrId: V4_POOL_ID, ...feeOverrides }),
      )

      expect(parsed?.fee0Amount?.toExact()).toBe('2.5')
      expect(parsed?.uncollectedFeesUsd).toBe(4.5)
    })

    it('leaves every fee field undefined when the response omits them', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position())

      expect(parsed?.token0UncollectedFees).toBeUndefined()
      expect(parsed?.token1UncollectedFees).toBeUndefined()
      expect(parsed?.fee0Amount).toBeUndefined()
      expect(parsed?.fee1Amount).toBeUndefined()
      expect(parsed?.uncollectedFeesUsd).toBeUndefined()
    })

    // Degraded rows use placeholder 18-decimal tokens, so a CurrencyAmount built from them would
    // be a wrong human amount rather than a missing one; only the decimals-independent fields map.
    it('passes raw fee strings and USD through on a degraded row but skips the CurrencyAmounts', () => {
      const parsed = parseLiquidityServicePosition(degradedV3Position(feeOverrides))

      expect(parsed?.token0UncollectedFees).toBe('2500000')
      expect(parsed?.token1UncollectedFees).toBe('1000000000000000')
      expect(parsed?.uncollectedFeesUsd).toBe(4.5)
      expect(parsed?.fee0Amount).toBeUndefined()
      expect(parsed?.fee1Amount).toBeUndefined()
    })

    it('keeps the position when a fee string is malformed, degrading only that CurrencyAmount', () => {
      const parsed = parseLiquidityServicePosition(
        enrichedV3Position({ ...feeOverrides, token0UncollectedFees: 'not-an-integer' }),
      )

      expect(parsed).toBeDefined()
      expect(parsed?.fee0Amount).toBeUndefined()
      expect(parsed?.fee1Amount?.toExact()).toBe('0.001')
      expect(parsed?.uncollectedFeesUsd).toBe(4.5)
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    // A real decoded message, not a cast fixture: pins that the proto fields are explicit-presence
    // (`optional`), so an unset double decodes as undefined rather than a settled 0.
    it('leaves fees undefined on a real decoded Position that omits them', () => {
      const parsed = parseLiquidityServicePosition(
        new LiquidityServicePosition({
          version: Protocols.V3,
          chainId: 1,
          poolAddressOrId: V3_POOL_ADDRESS,
          tokenId: '123',
        }),
      )

      expect(parsed).toBeDefined()
      expect(parsed?.uncollectedFeesUsd).toBeUndefined()
      expect(parsed?.token0UncollectedFees).toBeUndefined()
    })

    it('maps APR but never fee fields for a V2 pair', () => {
      const parsed = parseLiquidityServicePosition(enrichedV2Position({ apr1d: 0.05, apr7d: 0.04, apr30d: 0.03 }))

      expect(parsed?.apr1d).toBe(0.05)
      expect(parsed?.apr7d).toBe(0.04)
      expect(parsed?.apr30d).toBe(0.03)
      expect(parsed?.token0UncollectedFees).toBeUndefined()
      expect(parsed?.fee0Amount).toBeUndefined()
      expect(parsed?.uncollectedFeesUsd).toBeUndefined()
    })
  })

  describe('dynamic-fee flag', () => {
    // Dynamic fees are v4-only, and the v4-sdk separately requires a dynamic-fee pool to have a hook.
    const dynamicV4 = (overrides: Record<string, unknown>): LiquidityServicePosition =>
      enrichedV3Position({
        version: Protocols.V4,
        poolAddressOrId: V4_POOL_ID,
        hookAddress: HOOK_ADDRESS,
        ...overrides,
      })

    it('reads the served is_dynamic_fee flag', () => {
      const parsed = parseLiquidityServicePosition(dynamicV4({ feeTier: DYNAMIC_FEE_AMOUNT, isDynamicFee: true }))
      expect(parsed?.feeTier?.isDynamic).toBe(true)
    })

    // Transitional: the backend does not serve is_dynamic_fee on Position yet, and `?? false` would
    // silently render a dynamic position as a ~838% rate instead of "Dynamic".
    it('falls back to the sentinel fee when the flag is absent', () => {
      const parsed = parseLiquidityServicePosition(dynamicV4({ feeTier: DYNAMIC_FEE_AMOUNT }))
      expect(parsed?.feeTier?.isDynamic).toBe(true)
    })

    it('stays static for a served static fee with no flag', () => {
      const parsed = parseLiquidityServicePosition(dynamicV4({ feeTier: 500 }))
      expect(parsed?.feeTier?.isDynamic).toBe(false)
    })
  })

  describe('malformed positions', () => {
    it('skips a V3/V4 position without a tokenId (malformed, logged)', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ tokenId: undefined }))

      expect(parsed).toBeUndefined()
      expect(mockLoggerWarn).toHaveBeenCalledTimes(1)
    })

    it('skips a position with an unknown protocol version', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ version: 99 }))

      expect(parsed).toBeUndefined()
    })
  })

  describe('LP-incentive reward APRs', () => {
    const uniReward = {
      token: { chainId: 1, address: UNI, symbol: 'UNI', decimals: 18, isNative: false },
      boostedPoolApr: 3.2,
    }
    const morphoReward = {
      token: { chainId: 8453, address: MORPHO, symbol: 'MORPHO', decimals: 18, isNative: false },
      boostedPoolApr: 1,
    }

    it('carries one entry per reward token, preserving the reward token chain', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ rewards: [uniReward, morphoReward] }))

      expect(parsed?.rewards).toEqual([uniReward, morphoReward])
      // The reward token's chain is the campaign's, not the position's (chainId 1 here).
      expect(parsed?.rewards?.[1]?.token.chainId).toBe(8453)
    })

    it('leaves rewards unset when the field is absent', () => {
      // Protobuf JSON omits empty repeated fields, so an uncampaigned pool arrives without the key
      // at all rather than as [] — and so does anything cached before the field existed.
      expect(parseLiquidityServicePosition(enrichedV3Position())?.rewards).toBeUndefined()
      expect(parseLiquidityServicePosition(enrichedV3Position({ rewards: [] }))?.rewards).toBeUndefined()
    })

    it('drops an ended campaign, which keeps a claimable balance but no live boost', () => {
      const ended = { ...morphoReward, boostedPoolApr: 0 }
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ rewards: [uniReward, ended] }))

      expect(parsed?.rewards).toEqual([uniReward])
    })

    it('leaves rewards unset when every entry is dropped', () => {
      const parsed = parseLiquidityServicePosition(
        enrichedV3Position({ rewards: [{ ...uniReward, boostedPoolApr: 0 }] }),
      )

      expect(parsed?.rewards).toBeUndefined()
    })

    it('drops an entry with no reward token, since amounts are denominated in it', () => {
      const parsed = parseLiquidityServicePosition(enrichedV3Position({ rewards: [{ boostedPoolApr: 5 }, uniReward] }))

      expect(parsed?.rewards).toEqual([uniReward])
    })

    it('attaches rewards to V4 positions too', () => {
      const parsed = parseLiquidityServicePosition(
        enrichedV3Position({ version: Protocols.V4, poolAddressOrId: V4_POOL_ID, rewards: [uniReward] }),
      )

      expect(parsed?.version).toBe(ProtocolVersion.V4)
      expect(parsed?.rewards).toEqual([uniReward])
    })

    it('leaves V2 pairs unset — they run no campaigns', () => {
      expect(parseLiquidityServicePosition(enrichedV2Position())?.rewards).toBeUndefined()
    })
  })

  describe('LP-incentive reward balances', () => {
    const v4WithRewards = (rewards: unknown[]): ReturnType<typeof enrichedV3Position> =>
      enrichedV3Position({ version: Protocols.V4, poolAddressOrId: V4_POOL_ID, rewards })

    const uniBalance = {
      token: { chainId: 1, address: UNI, symbol: 'UNI', decimals: 18, name: 'Uniswap', isNative: false },
      boostedPoolApr: 3.2,
      unclaimedAmount: '12400000000000000000',
      unclaimedAmountUsd: 113.21,
    }

    it('carries one balance per reward token, in the shape the earnings surfaces read', () => {
      const parsed = parseLiquidityServicePosition(v4WithRewards([uniBalance]))

      expect(parsed?.version).toBe(ProtocolVersion.V4)
      expect(parsed?.version === ProtocolVersion.V4 && parsed.rewardBalances).toEqual([
        {
          token: { chainId: 1, address: UNI, symbol: 'UNI', decimals: 18, name: 'Uniswap', isNative: false },
          unclaimedAmount: '12400000000000000000',
          unclaimedAmountUsd: 113.21,
        },
      ])
    })

    it('keeps the balance from an ended campaign, which still owes what it accrued', () => {
      const ended = { ...uniBalance, boostedPoolApr: 0 }
      const parsed = parseLiquidityServicePosition(v4WithRewards([ended]))

      // Dropped from the APR list — no live boost — but the claimable balance survives.
      expect(parsed?.rewards).toBeUndefined()
      expect(parsed?.version === ProtocolVersion.V4 && parsed.rewardBalances).toHaveLength(1)
    })

    it('drops a live boost that has accrued nothing', () => {
      const parsed = parseLiquidityServicePosition(v4WithRewards([{ token: uniBalance.token, boostedPoolApr: 3.2 }]))

      expect(parsed?.rewards).toHaveLength(1)
      expect(parsed?.version === ProtocolVersion.V4 && parsed.rewardBalances).toBeUndefined()
    })

    it('drops a balance whose token carries no decimals to denominate it', () => {
      const noDecimals = {
        ...uniBalance,
        token: { chainId: 1, address: UNI, symbol: 'UNI', isNative: false },
      }
      const parsed = parseLiquidityServicePosition(v4WithRewards([noDecimals]))

      expect(parsed?.version === ProtocolVersion.V4 && parsed.rewardBalances).toBeUndefined()
    })

    it('keeps an unpriced balance — the amount is known even when its USD value is not', () => {
      const unpriced = { ...uniBalance, unclaimedAmountUsd: undefined }
      const parsed = parseLiquidityServicePosition(v4WithRewards([unpriced]))

      const balances = parsed?.version === ProtocolVersion.V4 ? parsed.rewardBalances : undefined
      expect(balances).toHaveLength(1)
      expect(balances?.[0]?.unclaimedAmountUsd).toBeUndefined()
    })
  })

  describe('enum mapping helpers', () => {
    it('round-trips ProtocolVersion <-> Protocols', () => {
      expect(protocolVersionToLiquidityServiceProtocols(ProtocolVersion.V2)).toBe(Protocols.V2)
      expect(protocolVersionToLiquidityServiceProtocols(ProtocolVersion.V3)).toBe(Protocols.V3)
      expect(protocolVersionToLiquidityServiceProtocols(ProtocolVersion.V4)).toBe(Protocols.V4)
      expect(protocolVersionToLiquidityServiceProtocols(ProtocolVersion.UNSPECIFIED)).toBeUndefined()
      expect(liquidityServiceProtocolsToProtocolVersion(Protocols.V2)).toBe(ProtocolVersion.V2)
      expect(liquidityServiceProtocolsToProtocolVersion('V4')).toBe(ProtocolVersion.V4)
      expect(normalizeLiquidityServiceProtocols('V2')).toBe(Protocols.V2)
    })
  })
})
