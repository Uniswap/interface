import { CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { describe, expect, it } from 'vitest'
import {
  buildAuctionAmountsFromLiquidityPreview,
  getPostAuctionLiquidityAmountFromAllocation,
  isPostAuctionLiquidityAllocationValid,
  normalizePostAuctionLiquidityAllocation,
  updateCommittedPostAuctionLiquidity,
} from '~/pages/Liquidity/CreateAuction/store/postAuctionLiquidityAllocationState'
import {
  DEFAULT_EXISTING_TOKEN_AUCTION_SUPPLY_PERCENT,
  MIN_POST_AUCTION_LIQUIDITY_PERCENT,
  PostAuctionLiquidityAllocationType,
  UNBOUNDED_TIER_ID,
} from '~/pages/Liquidity/CreateAuction/types'
import { parseCompactNumberInput } from '~/pages/Liquidity/CreateAuction/utils'
import { TEST_TOKEN_1 } from '~/test-utils/constants'

describe('isPostAuctionLiquidityAllocationValid', () => {
  it('requires single allocations to meet the minimum LP percent', () => {
    expect(
      isPostAuctionLiquidityAllocationValid({
        type: PostAuctionLiquidityAllocationType.SINGLE,
        percent: MIN_POST_AUCTION_LIQUIDITY_PERCENT - 1,
      }),
    ).toBe(false)
    expect(
      isPostAuctionLiquidityAllocationValid({
        type: PostAuctionLiquidityAllocationType.SINGLE,
        percent: MIN_POST_AUCTION_LIQUIDITY_PERCENT,
      }),
    ).toBe(true)
  })

  it('requires a positive marginal effective rate for tiered allocations', () => {
    expect(
      isPostAuctionLiquidityAllocationValid({
        type: PostAuctionLiquidityAllocationType.TIERED,
        tiers: [
          { id: 'tier-1', raiseMilestone: '1m', percent: 0 },
          { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 0 },
        ],
      }),
    ).toBe(false)
  })
})

describe('normalizePostAuctionLiquidityAllocation', () => {
  it('returns non-tiered allocations unchanged', () => {
    const allocation = {
      type: PostAuctionLiquidityAllocationType.SINGLE,
      percent: 40,
    } as const
    expect(normalizePostAuctionLiquidityAllocation(allocation)).toBe(allocation)
  })

  it('clamps the first bounded tier milestone up to the minimum', () => {
    const normalized = normalizePostAuctionLiquidityAllocation({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [
        { id: 'tier-1', raiseMilestone: '0', percent: 50 },
        { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 25 },
      ],
    })
    expect(normalized.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (normalized.type === PostAuctionLiquidityAllocationType.TIERED) {
      expect(normalized.tiers[0]?.raiseMilestone).toBe('1')
    }
  })

  it('bumps a bounded tier milestone when it is not above the previous tier', () => {
    // Use small milestones so formatted output round-trips (compact "k"/"m" can collapse e.g. 10001 → 10k).
    const normalized = normalizePostAuctionLiquidityAllocation({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [
        { id: 'tier-1', raiseMilestone: '1', percent: 40 },
        { id: 'tier-2', raiseMilestone: '1', percent: 30 },
        { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 20 },
      ],
    })
    expect(normalized.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (normalized.type === PostAuctionLiquidityAllocationType.TIERED) {
      const first = parseCompactNumberInput(normalized.tiers[0]?.raiseMilestone ?? '')
      const second = parseCompactNumberInput(normalized.tiers[1]?.raiseMilestone ?? '')
      expect(first).toBe(1)
      expect(second).toBe(2)
    }
  })

  it('passes through an unbounded-only tier list with clamped percents', () => {
    const normalized = normalizePostAuctionLiquidityAllocation({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [{ id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 120 }],
    })
    expect(normalized.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (normalized.type === PostAuctionLiquidityAllocationType.TIERED) {
      expect(normalized.tiers).toHaveLength(1)
      expect(normalized.tiers[0]).toMatchObject({
        id: UNBOUNDED_TIER_ID,
        raiseMilestone: '',
        percent: 100,
      })
    }
  })
})

describe('buildAuctionAmountsFromLiquidityPreview', () => {
  it('splits total supply using the preview percent', () => {
    const decimals = TEST_TOKEN_1.decimals
    const totalSupply = CurrencyAmount.fromRawAmount(TEST_TOKEN_1, (1_000n * 10n ** BigInt(decimals)).toString())
    const { auctionSupplyAmount, postAuctionLiquidityAmount } = buildAuctionAmountsFromLiquidityPreview(totalSupply, {
      previewPercent: 50,
    })
    expect(auctionSupplyAmount.equalTo(totalSupply.multiply(new Percent(25, 100)))).toBe(true)
    expect(postAuctionLiquidityAmount.greaterThan(0)).toBe(true)
  })

  it('uses the provided auctionSupplyPercent override', () => {
    const decimals = TEST_TOKEN_1.decimals
    const totalSupply = CurrencyAmount.fromRawAmount(TEST_TOKEN_1, (1_000n * 10n ** BigInt(decimals)).toString())
    const { auctionSupplyAmount } = buildAuctionAmountsFromLiquidityPreview(totalSupply, {
      previewPercent: 50,
      auctionSupplyPercent: DEFAULT_EXISTING_TOKEN_AUCTION_SUPPLY_PERCENT,
    })
    expect(auctionSupplyAmount.equalTo(totalSupply)).toBe(true)
  })
})

describe('getPostAuctionLiquidityAmountFromAllocation', () => {
  it('returns zero for tiered allocations with no effective LP rate', () => {
    const auctionSupply = CurrencyAmount.fromRawAmount(
      TEST_TOKEN_1,
      (100n * 10n ** BigInt(TEST_TOKEN_1.decimals)).toString(),
    )
    const amount = getPostAuctionLiquidityAmountFromAllocation(auctionSupply, {
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [
        { id: 'tier-1', raiseMilestone: '1m', percent: 0 },
        { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 0 },
      ],
    })
    expect(amount.equalTo(0)).toBe(true)
  })
})

describe('updateCommittedPostAuctionLiquidity', () => {
  it('returns undefined when committed state is undefined', () => {
    expect(
      updateCommittedPostAuctionLiquidity(undefined, { type: PostAuctionLiquidityAllocationType.SINGLE, percent: 50 }),
    ).toBeUndefined()
  })

  it('recomputes post-auction liquidity from the current allocation', () => {
    const decimals = TEST_TOKEN_1.decimals
    const totalSupply = CurrencyAmount.fromRawAmount(TEST_TOKEN_1, (1_000n * 10n ** BigInt(decimals)).toString())
    const committed = buildAuctionAmountsFromLiquidityPreview(totalSupply, { previewPercent: 50 })
    const updated = updateCommittedPostAuctionLiquidity(committed, {
      type: PostAuctionLiquidityAllocationType.SINGLE,
      percent: MIN_POST_AUCTION_LIQUIDITY_PERCENT,
    })
    expect(updated).toBeDefined()
    expect(updated?.postAuctionLiquidityAmount).toBeDefined()
    expect(
      updated?.postAuctionLiquidityAmount.equalTo(
        getPostAuctionLiquidityAmountFromAllocation(committed.auctionSupplyAmount, {
          type: PostAuctionLiquidityAllocationType.SINGLE,
          percent: MIN_POST_AUCTION_LIQUIDITY_PERCENT,
        }),
      ),
    ).toBe(true)
  })
})
