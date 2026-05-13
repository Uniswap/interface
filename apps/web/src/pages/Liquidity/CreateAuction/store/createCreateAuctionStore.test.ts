import { describe, expect, it } from 'vitest'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import {
  CustomPriceRangeBound,
  CUSTOM_PRICE_RANGE_PRESETS,
  MAX_CUSTOM_PRICE_RANGE_ENTRIES,
  MAX_POST_AUCTION_LIQUIDITY_TIERS,
  PostAuctionLiquidityAllocationType,
  PriceRangeStrategy,
} from '~/pages/Liquidity/CreateAuction/types'
import { percentOfSoldToLiquidityFromDepositAndLiquidityAmount } from '~/pages/Liquidity/CreateAuction/utils'

describe('createCreateAuctionStore', () => {
  it('starts with single post-auction liquidity allocation', () => {
    const store = createCreateAuctionStore()
    const allocation = store.getState().configureAuction.postAuctionLiquidityAllocation

    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.SINGLE)
    if (allocation.type !== PostAuctionLiquidityAllocationType.SINGLE) {
      throw new Error('expected single allocation')
    }
    expect(allocation.percent).toBe(100)
  })

  it('keeps flat tiered allocation equivalent to single allocation', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.commitTokenFormAndAdvance()
    actions.setSinglePostAuctionLiquidityPercent(50)
    actions.setFloorPrice('0.1')

    const singleAllocationLiquidityAmount = store
      .getState()
      .configureAuction.committed!.postAuctionLiquidityAmount.toExact()

    actions.setPostAuctionLiquidityAllocationType(PostAuctionLiquidityAllocationType.TIERED)

    let state = store.getState()
    let allocation = state.configureAuction.postAuctionLiquidityAllocation
    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
      throw new Error('expected tiered allocation')
    }
    expect(state.configureAuction.committed!.postAuctionLiquidityAmount.toExact()).toBe(singleAllocationLiquidityAmount)

    actions.addPostAuctionLiquidityTier()

    state = store.getState()
    allocation = state.configureAuction.postAuctionLiquidityAllocation
    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
      throw new Error('expected tiered allocation')
    }
    expect(allocation.tiers).toHaveLength(2)
    expect(allocation.tiers[0]?.percent).toBe(50)
    expect(allocation.tiers[1]?.percent).toBe(50)
    expect(state.configureAuction.committed!.postAuctionLiquidityAmount.toExact()).toBe(singleAllocationLiquidityAmount)
  })

  it('resolves tiered liquidity from the tier whose raise range matches the final raise', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.commitTokenFormAndAdvance()
    actions.setSinglePostAuctionLiquidityPercent(60)

    let state = store.getState()
    let allocation = state.configureAuction.postAuctionLiquidityAllocation
    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.SINGLE)
    if (allocation.type !== PostAuctionLiquidityAllocationType.SINGLE) {
      throw new Error('expected single allocation')
    }
    expect(allocation.percent).toBe(60)
    expect(
      percentOfSoldToLiquidityFromDepositAndLiquidityAmount(
        state.configureAuction.committed!.auctionSupplyAmount,
        state.configureAuction.committed!.postAuctionLiquidityAmount,
      ),
    ).toBe(60)

    actions.setFloorPrice('0.1')
    actions.setPostAuctionLiquidityAllocationType(PostAuctionLiquidityAllocationType.TIERED)

    state = store.getState()
    allocation = state.configureAuction.postAuctionLiquidityAllocation
    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
      throw new Error('expected tiered allocation')
    }
    actions.addPostAuctionLiquidityTier()
    actions.addPostAuctionLiquidityTier()
    actions.updatePostAuctionLiquidityTier('tier-1', { raiseMilestone: '10m', percent: 85 })
    actions.updatePostAuctionLiquidityTier('tier-2', { raiseMilestone: '20m', percent: 40 })

    state = store.getState()
    allocation = state.configureAuction.postAuctionLiquidityAllocation
    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
      throw new Error('expected tiered allocation')
    }
    // 3 tiers: tier-1 (bounded), tier-2 (bounded), unbounded
    expect(allocation.tiers).toHaveLength(3)
    expect(allocation.tiers[0]?.raiseMilestone).toBe('10m')
    expect(allocation.tiers[1]?.raiseMilestone).toBe('20m')

    actions.removePostAuctionLiquidityTier('tier-2')
    actions.setFloorPrice('0.02')

    state = store.getState()
    allocation = state.configureAuction.postAuctionLiquidityAllocation
    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
      throw new Error('expected tiered allocation')
    }
    // 2 tiers remain: tier-1 (bounded) + unbounded
    expect(allocation.tiers).toHaveLength(2)
    expect(state.configureAuction.committed!.postAuctionLiquidityAmount.toExact()).toBe('114864864.864864864864864864')
  })

  it('limits tiered allocation to ten tiers', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.commitTokenFormAndAdvance()
    actions.setFloorPrice('0.1')
    actions.setPostAuctionLiquidityAllocationType(PostAuctionLiquidityAllocationType.TIERED)

    for (let i = 1; i < MAX_POST_AUCTION_LIQUIDITY_TIERS; i++) {
      actions.addPostAuctionLiquidityTier()
    }

    let state = store.getState()
    let allocation = state.configureAuction.postAuctionLiquidityAllocation
    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
      throw new Error('expected tiered allocation')
    }
    expect(allocation.tiers).toHaveLength(MAX_POST_AUCTION_LIQUIDITY_TIERS)

    actions.addPostAuctionLiquidityTier()

    state = store.getState()
    allocation = state.configureAuction.postAuctionLiquidityAllocation
    expect(allocation.type).toBe(PostAuctionLiquidityAllocationType.TIERED)
    if (allocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
      throw new Error('expected tiered allocation')
    }
    expect(allocation.tiers).toHaveLength(MAX_POST_AUCTION_LIQUIDITY_TIERS)
  })

  it('initializes custom price ranges when selecting custom range', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.setPriceRangeStrategy(PriceRangeStrategy.CUSTOM_RANGE)

    const { customizePool } = store.getState()
    expect(customizePool.priceRangeStrategy).toBe(PriceRangeStrategy.CUSTOM_RANGE)
    expect(customizePool.customPriceRanges).toEqual([
      {
        id: 'custom-range-1',
        liquidityPercent: 100,
        minPercentFromClearing: CustomPriceRangeBound.NegativeInfinity,
        maxPercentFromClearing: CustomPriceRangeBound.PositiveInfinity,
      },
    ])
  })

  it('adds custom range presets with remaining percent', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.setPriceRangeStrategy(PriceRangeStrategy.CUSTOM_RANGE)
    actions.addCustomPriceRangePreset(CUSTOM_PRICE_RANGE_PRESETS[0])

    expect(store.getState().customizePool.customPriceRanges).toEqual([
      {
        id: 'custom-range-1',
        liquidityPercent: 100,
        minPercentFromClearing: CustomPriceRangeBound.NegativeInfinity,
        maxPercentFromClearing: CustomPriceRangeBound.PositiveInfinity,
      },
      {
        id: 'custom-range-2',
        liquidityPercent: 0,
        minPercentFromClearing: -50,
        maxPercentFromClearing: 100,
      },
    ])
  })

  it('updates custom range percents while preserving a 100 percent total', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.setPriceRangeStrategy(PriceRangeStrategy.CUSTOM_RANGE)
    actions.addCustomPriceRangePreset(CUSTOM_PRICE_RANGE_PRESETS[0])
    actions.addCustomPriceRangePreset(CUSTOM_PRICE_RANGE_PRESETS[2])
    actions.updateCustomPriceRangeLiquidityPercent('custom-range-2', 25)

    const percents = store.getState().customizePool.customPriceRanges.map((entry) => entry.liquidityPercent)
    expect(percents).toEqual([75, 25, 0])
    expect(percents.reduce((sum, percent) => sum + percent, 0)).toBe(100)
  })

  it('updates custom range bounds', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.setPriceRangeStrategy(PriceRangeStrategy.CUSTOM_RANGE)
    actions.updateCustomPriceRangeBounds('custom-range-1', {
      minPercentFromClearing: -20,
      maxPercentFromClearing: 25,
    })

    expect(store.getState().customizePool.customPriceRanges[0]).toMatchObject({
      minPercentFromClearing: -20,
      maxPercentFromClearing: 25,
    })
  })

  it('removes custom range rows and transfers liquidity percent to the last remaining row', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.setPriceRangeStrategy(PriceRangeStrategy.CUSTOM_RANGE)
    actions.addCustomPriceRangePreset(CUSTOM_PRICE_RANGE_PRESETS[0])
    actions.addCustomPriceRangePreset(CUSTOM_PRICE_RANGE_PRESETS[1])
    actions.updateCustomPriceRangeLiquidityPercent('custom-range-2', 25)
    actions.removeCustomPriceRange('custom-range-2')

    expect(store.getState().customizePool.customPriceRanges.map((entry) => entry.liquidityPercent)).toEqual([75, 25])
  })

  it('limits custom price ranges to ten entries', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()

    actions.setPriceRangeStrategy(PriceRangeStrategy.CUSTOM_RANGE)
    for (let i = 1; i < MAX_CUSTOM_PRICE_RANGE_ENTRIES; i++) {
      actions.addCustomPriceRangePreset(CUSTOM_PRICE_RANGE_PRESETS[i % CUSTOM_PRICE_RANGE_PRESETS.length])
    }

    expect(store.getState().customizePool.customPriceRanges).toHaveLength(MAX_CUSTOM_PRICE_RANGE_ENTRIES)

    actions.addCustomPriceRangePreset(CUSTOM_PRICE_RANGE_PRESETS[0])

    expect(store.getState().customizePool.customPriceRanges).toHaveLength(MAX_CUSTOM_PRICE_RANGE_ENTRIES)
  })
})
