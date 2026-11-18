import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { USDC, USDC_MAINNET, USDT } from 'uniswap/src/constants/tokens'
import { ETH } from 'uniswap/src/test/fixtures/lib/sdk'
import {
  buildBucketChartEntries,
  buildBuckets,
  buildFullGranularityBuckets,
  buildSegmentsFromRawTicks,
  createDisplayPriceAtTick,
  getFullGranularityStep,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import {
  SORTED_TICK_DATA_WITH_LIQUIDITY_ACTIVE,
  TICK_DATA,
  TICK_DATA_WITH_ONE_TICK_AND_ONE_FULL_RANGE,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/mocks/tickData'
import { getDisplayPriceFromTick } from '~/features/Liquidity/utils/getTickToPrice'
import { ETH_MAINNET } from '~/test-utils/constants'

describe('buildSegmentsFromRawTicks', () => {
  describe('thin liquidity', () => {
    it('should build segments from raw ticks', () => {
      const segments = buildSegmentsFromRawTicks(TICK_DATA)
      expect(segments).toEqual([
        {
          startTick: -887220,
          endTick: -60,
          liquidityActive: 8732830609n,
        },
        {
          startTick: -60,
          endTick: 60,
          liquidityActive: 455979558458n,
        },
        {
          startTick: 60,
          endTick: 887220,
          liquidityActive: 8732830609n,
        },
      ])
    })
  })
})

describe('buildBuckets', () => {
  describe('thin liquidity', () => {
    describe('full range (zoomed out)', () => {
      it('should build buckets from segments', () => {
        const segments = buildSegmentsFromRawTicks(TICK_DATA)
        const buckets = buildBuckets({
          segments,
          visibleMinTick: -887220,
          visibleMaxTick: 887220,
          desiredBars: 5,
          tickSpacing: 60,
        })
        // Bucket boundaries are derived from getBucketBoundaries:
        //   snappedMin = floor(-887220 / 60) * 60 = -887220
        //   snappedMax = ceil(887220 / 60) * 60 = 887220
        //   range = 887220 - (-887220) = 1,774,440
        //   rawStep = 1,774,440 / 5 desiredBars = 354,888
        //   step = Math.max(60, Math.round(354888 / 60) * 60) = Math.max(60, 5915 * 60) = 354,900
        //
        // Boundaries starting from snappedMin (-887220), incrementing by step (354,900):
        //   -887220
        //   -887220 + 354900 = -532320
        //   -532320 + 354900 = -177420
        //   -177420 + 354900 =  177480
        //    177480 + 354900 =  532380
        //    532380 + 354900 =  887280 > snappedMax, so loop stops
        //    887220 appended (since 532380 < snappedMax)
        //
        // Each bucket uses the max liquidity from overlapping segments.
        // Bucket [-177420, 177480) overlaps segment [-60, 60) which has the highest liquidity.
        expect(buckets).toEqual([
          {
            liquidityActive: 8732830609n,
            endTick: -532320,
            segmentEndTick: -60,
            segmentStartTick: -887220,
            startTick: -887220,
          },
          {
            liquidityActive: 8732830609n,
            endTick: -177420,
            segmentEndTick: -60,
            segmentStartTick: -887220,
            startTick: -532320,
          },
          {
            liquidityActive: 455979558458n,
            endTick: 177480,
            segmentEndTick: 60,
            segmentStartTick: -60,
            startTick: -177420,
          },
          {
            liquidityActive: 8732830609n,
            endTick: 532380,
            segmentEndTick: 887220,
            segmentStartTick: 60,
            startTick: 177480,
          },
          {
            liquidityActive: 8732830609n,
            endTick: 887220,
            segmentEndTick: 887220,
            segmentStartTick: 60,
            startTick: 532380,
          },
        ])
      })
    })
    describe('tighter range (zoomed in)', () => {
      it('should build buckets from segments', () => {
        const segments = buildSegmentsFromRawTicks(TICK_DATA)
        const buckets = buildBuckets({
          segments,
          visibleMinTick: -1200,
          visibleMaxTick: 1200,
          desiredBars: 5,
          tickSpacing: 60,
        })
        // Bucket boundaries:
        //   range = 1200 - (-1200) = 2,400
        //   rawStep = 2,400 / 5 = 480
        //   step = Math.max(60, Math.round(480 / 60) * 60) = 480
        //
        //   Boundaries: -1200, -720, -240, 240, 720, 1200
        //
        //   Bucket [-240, 240) overlaps segment [-60, 60) which has the highest liquidity.
        expect(buckets).toEqual([
          {
            liquidityActive: 8732830609n,
            endTick: -720,
            segmentEndTick: -60,
            segmentStartTick: -887220,
            startTick: -1200,
          },
          {
            liquidityActive: 8732830609n,
            endTick: -240,
            segmentEndTick: -60,
            segmentStartTick: -887220,
            startTick: -720,
          },
          {
            liquidityActive: 455979558458n,
            endTick: 240,
            segmentEndTick: 60,
            segmentStartTick: -60,
            startTick: -240,
          },
          {
            liquidityActive: 8732830609n,
            endTick: 720,
            segmentEndTick: 887220,
            segmentStartTick: 60,
            startTick: 240,
          },
          {
            liquidityActive: 8732830609n,
            endTick: 1200,
            segmentEndTick: 887220,
            segmentStartTick: 60,
            startTick: 720,
          },
        ])
      })
    })
    describe('tightest range (zoomed in)', () => {
      it('should build buckets from segments', () => {
        const segments = buildSegmentsFromRawTicks(TICK_DATA)
        const buckets = buildBuckets({
          segments,
          visibleMinTick: -120,
          visibleMaxTick: 120,
          desiredBars: 5,
          tickSpacing: 60,
        })
        // Bucket boundaries:
        //   range = 120 - (-120) = 240
        //   rawStep = 240 / 5 = 48
        //   step = Math.max(60, Math.round(48 / 60) * 60) = Math.max(60, 1 * 60) = 60
        //
        //   Boundaries: -120, -60, 0, 60, 120
        //
        //   Buckets [-60, 0) and [0, 60) overlap segment [-60, 60) with the highest liquidity.
        expect(buckets).toEqual([
          {
            liquidityActive: 8732830609n,
            endTick: -60,
            segmentEndTick: -60,
            segmentStartTick: -887220,
            startTick: -120,
          },
          {
            liquidityActive: 455979558458n,
            endTick: 0,
            segmentEndTick: 60,
            segmentStartTick: -60,
            startTick: -60,
          },
          {
            liquidityActive: 455979558458n,
            endTick: 60,
            segmentEndTick: 60,
            segmentStartTick: -60,
            startTick: 0,
          },
          {
            liquidityActive: 8732830609n,
            endTick: 120,
            segmentEndTick: 887220,
            segmentStartTick: 60,
            startTick: 60,
          },
        ])
      })
    })
  })
  describe('thin liquidity with one tick and one full range', () => {
    it('should build buckets from segments', () => {
      const segments = buildSegmentsFromRawTicks(TICK_DATA_WITH_ONE_TICK_AND_ONE_FULL_RANGE)
      const buckets = buildBuckets({
        segments,
        visibleMinTick: -887220,
        visibleMaxTick: 887220,
        desiredBars: 5,
        tickSpacing: 60,
      })
      expect(buckets).toEqual([
        {
          liquidityActive: 8732830609n,
          endTick: -532320,
          segmentEndTick: 0,
          segmentStartTick: -887220,
          startTick: -887220,
        },
        {
          liquidityActive: 8732830609n,
          endTick: -177420,
          segmentEndTick: 0,
          segmentStartTick: -887220,
          startTick: -532320,
        },
        {
          liquidityActive: 455979558458n,
          endTick: 177480,
          segmentEndTick: 60,
          segmentStartTick: 0,
          startTick: -177420,
        },
        {
          liquidityActive: 8732830609n,
          endTick: 532380,
          segmentEndTick: 887220,
          segmentStartTick: 60,
          startTick: 177480,
        },
        {
          liquidityActive: 8732830609n,
          endTick: 887220,
          segmentEndTick: 887220,
          segmentStartTick: 60,
          startTick: 532380,
        },
      ])
    })
  })
})

describe('buildBucketChartEntries', () => {
  it('should build bucket chart entries from buckets and liquidity data', () => {
    const buckets = buildBuckets({
      segments: buildSegmentsFromRawTicks(TICK_DATA),
      visibleMinTick: -887220,
      visibleMaxTick: 887220,
      desiredBars: 5,
      tickSpacing: 60,
    })
    const bucketChartEntries = buildBucketChartEntries({
      buckets,
      liquidityData: SORTED_TICK_DATA_WITH_LIQUIDITY_ACTIVE,
      baseCurrency: USDT,
      quoteCurrency: USDC,
      priceInverted: false,
      protocolVersion: ProtocolVersion.V4,
    })
    expect(bucketChartEntries).toEqual([
      {
        startTick: -887220,
        endTick: -532320,
        liquidityActive: 8732830609n,
        amount0Locked: 8732.830609,
        amount1Locked: 8732.830609,
        segmentStartTick: -887220,
        segmentEndTick: -60,
        price0: 3.3849213e38,
      },
      {
        startTick: -532320,
        endTick: -177420,
        liquidityActive: 8732830609n,
        amount0Locked: 8732.830609,
        amount1Locked: 8732.830609,
        segmentStartTick: -887220,
        segmentEndTick: -60,
        price0: 1.3098091e23,
      },
      {
        startTick: -177420,
        endTick: 177480,
        liquidityActive: 455979558458n,
        // Amounts are scoped to the max-liquidity segment [-60, 60) — the entry at tick 0 —
        // and exclude the neighboring segment's entry at tick 60 even though it starts
        // inside this bucket's [-177420, 177480) range.
        amount0Locked: 8.411022058540207e24,
        amount1Locked: 455979.558458,
        segmentStartTick: -60,
        segmentEndTick: 60,
        price0: 50683601,
      },
      {
        startTick: 177480,
        endTick: 532380,
        liquidityActive: 8732830609n,
        amount0Locked: 0,
        amount1Locked: 8706.672682,
        segmentStartTick: 60,
        segmentEndTick: 887220,
        price0: 1.9612227e-8,
      },
      {
        startTick: 532380,
        endTick: 887220,
        liquidityActive: 8732830609n,
        amount0Locked: 0,
        amount1Locked: 8706.672682,
        segmentStartTick: 60,
        segmentEndTick: 887220,
        price0: 7.5890313e-24,
      },
    ])
  })

  it('scopes locked amounts to the max-liquidity segment when a bucket merges several segments (LP-288)', () => {
    // One bucket spanning all three segments of TICK_DATA. The bar's height and the tooltip's
    // price range / bps width describe only the max-liquidity segment [-60, 60), so the locked
    // amounts must come from that segment alone — not from every entry inside the bucket.
    const buckets = buildBuckets({
      segments: buildSegmentsFromRawTicks(TICK_DATA),
      visibleMinTick: -887220,
      visibleMaxTick: 887220,
      desiredBars: 1,
      tickSpacing: 60,
    })
    expect(buckets).toHaveLength(1)
    expect(buckets[0].segmentStartTick).toBe(-60)
    expect(buckets[0].segmentEndTick).toBe(60)

    const bucketChartEntries = buildBucketChartEntries({
      buckets,
      liquidityData: SORTED_TICK_DATA_WITH_LIQUIDITY_ACTIVE,
      baseCurrency: USDT,
      quoteCurrency: USDC,
      priceInverted: false,
      protocolVersion: ProtocolVersion.V4,
    })

    // Only the entry at tick 0 lies inside [-60, 60); the entries at -887220 and 60 belong to
    // neighboring segments and must not inflate this bar's amounts.
    expect(bucketChartEntries[0].amount0Locked).toBe(8.411022058540207e24)
    expect(bucketChartEntries[0].amount1Locked).toBe(455979.558458)
  })

  it('falls back to the nearest entry at or below the segment start when no entry lies inside the segment', () => {
    // The covering entry can start before segmentStartTick (e.g. the synthetic active-tick
    // entry replaces the initialized tick at the segment start); the floor lookup must then
    // pick up the nearest entry at or below the segment start.
    const buckets = buildBuckets({
      segments: buildSegmentsFromRawTicks(TICK_DATA),
      visibleMinTick: -887220,
      visibleMaxTick: 887220,
      desiredBars: 1,
      tickSpacing: 60,
    })
    expect(buckets[0].segmentStartTick).toBe(-60)
    expect(buckets[0].segmentEndTick).toBe(60)

    const floorOnlyLiquidityData = [SORTED_TICK_DATA_WITH_LIQUIDITY_ACTIVE[0]] // single entry at -887220
    const bucketChartEntries = buildBucketChartEntries({
      buckets,
      liquidityData: floorOnlyLiquidityData,
      baseCurrency: USDT,
      quoteCurrency: USDC,
      priceInverted: false,
      protocolVersion: ProtocolVersion.V4,
    })
    expect(bucketChartEntries[0].amount0Locked).toBe(8732.830609)
    expect(bucketChartEntries[0].amount1Locked).toBe(8732.830609)
  })
})

/** A dense pool: `count` initialized ticks every `tickSpacing` around tick 0, liquidity rising toward the middle. */
function makeDenseTicks({ count, tickSpacing }: { count: number; tickSpacing: number }): {
  rawTicks: { tick: number; liquidityNet: string }[]
  liquidityData: {
    tick: number
    price0: number
    liquidityActive: number
    amount0Locked: number
    amount1Locked: number
  }[]
} {
  const half = Math.floor(count / 2)
  const rawTicks = Array.from({ length: count }, (_, i) => {
    const tick = (i - half) * tickSpacing
    // Net adds on the way up to the middle and removes after it, ending back at zero.
    const liquidityNet =
      i === count - 1 ? (-half * 1000 * (half + 1)) / 2 : i < half ? (i + 1) * 1000 : -(i - half + 1) * 1000
    return { tick, liquidityNet: String(liquidityNet) }
  })
  const liquidityData = rawTicks.map(({ tick }, i) => ({
    tick,
    price0: 1.0001 ** tick,
    liquidityActive: i,
    amount0Locked: tick >= 0 ? 1 : 0,
    amount1Locked: tick < 0 ? 1 : 0,
  }))
  return { rawTicks, liquidityData }
}

/** The per-bucket scan buildBuckets used before it swept, as the reference its picks must match. */
function scanMaxSegment(
  segments: ReturnType<typeof buildSegmentsFromRawTicks>,
  startTick: number,
  endTick: number,
): { liquidityActive: bigint; segmentStartTick: number; segmentEndTick: number } {
  let liquidityActive = 0n
  let match: (typeof segments)[number] | undefined
  for (const segment of segments) {
    if (segment.startTick < endTick && segment.endTick > startTick && segment.liquidityActive > liquidityActive) {
      liquidityActive = segment.liquidityActive
      match = segment
    }
  }
  return {
    liquidityActive,
    segmentStartTick: match?.startTick ?? startTick,
    segmentEndTick: match?.endTick ?? endTick,
  }
}

describe('getFullGranularityStep', () => {
  it('is one tick spacing while each spacing spans at least a pixel', () => {
    expect(getFullGranularityStep({ tickSpacing: 10, ticksPerPixel: 0.5 })).toBe(10)
    expect(getFullGranularityStep({ tickSpacing: 10, ticksPerPixel: 10 })).toBe(10)
  })

  it('merges just enough whole spacings to keep a bar a pixel tall when spacings outnumber pixels', () => {
    expect(getFullGranularityStep({ tickSpacing: 10, ticksPerPixel: 10.5 })).toBe(20)
    expect(getFullGranularityStep({ tickSpacing: 60, ticksPerPixel: 1000 })).toBe(1020)
  })

  it('ignores floating-point noise at a whole number of spacings, so a pan cannot flip the step', () => {
    expect(getFullGranularityStep({ tickSpacing: 10, ticksPerPixel: 20 + 1e-12 })).toBe(20)
    expect(getFullGranularityStep({ tickSpacing: 10, ticksPerPixel: 20 - 1e-12 })).toBe(20)
  })
})

describe('buildFullGranularityBuckets', () => {
  it('draws one contiguous bucket per tick spacing across the view, with the liquidity of the segment under it', () => {
    const segments = buildSegmentsFromRawTicks(TICK_DATA)
    const buckets = buildFullGranularityBuckets({
      segments,
      visibleMinTick: -300,
      visibleMaxTick: 300,
      tickSpacing: 60,
      ticksPerPixel: 2,
    })
    // One spacing past each edge of the view.
    expect(buckets[0].startTick).toBe(-360)
    expect(buckets[buckets.length - 1].endTick).toBe(360)
    expect(buckets).toHaveLength(12)
    buckets.forEach((bucket, i) => {
      expect(bucket.endTick - bucket.startTick).toBe(60)
      if (i > 0) {
        expect(bucket.startTick).toBe(buckets[i - 1].endTick)
      }
    })
    expect(buckets.find((b) => b.startTick === 0)).toEqual({
      startTick: 0,
      endTick: 60,
      liquidityActive: 455979558458n,
      segmentStartTick: -60,
      segmentEndTick: 60,
    })
    expect(buckets.find((b) => b.startTick === 120)?.liquidityActive).toBe(8732830609n)
  })

  it('keeps a bucket at least a pixel tall by merging spacings when zoomed out', () => {
    const segments = buildSegmentsFromRawTicks(TICK_DATA)
    const buckets = buildFullGranularityBuckets({
      segments,
      visibleMinTick: -30000,
      visibleMaxTick: 30000,
      tickSpacing: 60,
      // 60,000 ticks over 300px
      ticksPerPixel: 200,
    })
    // 240 ticks per bucket: 4 spacings, the fewest that reach 200 ticks.
    expect(buckets.every((b) => b.endTick - b.startTick === 240)).toBe(true)
    expect(buckets.length).toBeLessThanOrEqual(300 + 3)
  })

  it('anchors the grid to the tick origin, so a bucket keeps its range as the view pans', () => {
    const segments = buildSegmentsFromRawTicks(TICK_DATA)
    const build = (offset: number) =>
      buildFullGranularityBuckets({
        segments,
        visibleMinTick: -3000 + offset,
        visibleMaxTick: 3000 + offset,
        tickSpacing: 60,
        ticksPerPixel: 20,
      })
    const ranges = (buckets: ReturnType<typeof build>) => new Set(buckets.map((b) => `${b.startTick}:${b.endTick}`))
    const before = ranges(build(0))
    const after = ranges(build(37))
    expect([...after].filter((range) => before.has(range)).length).toBeGreaterThan(before.size - 3)
  })

  it('picks the same max-liquidity segment as a scan over every segment', () => {
    const { rawTicks } = makeDenseTicks({ count: 400, tickSpacing: 10 })
    const segments = buildSegmentsFromRawTicks(rawTicks)
    const buckets = buildFullGranularityBuckets({
      segments,
      visibleMinTick: -2500,
      visibleMaxTick: 2500,
      tickSpacing: 10,
      ticksPerPixel: 25,
    })
    expect(buckets.length).toBeGreaterThan(100)
    for (const bucket of buckets) {
      expect(bucket).toEqual({
        startTick: bucket.startTick,
        endTick: bucket.endTick,
        ...scanMaxSegment(segments, bucket.startTick, bucket.endTick),
      })
    }
  })

  it("bounds a pan frame's work by the chart's width, with one price lookup per bar", () => {
    const { rawTicks, liquidityData } = makeDenseTicks({ count: 6000, tickSpacing: 10 })
    const segments = buildSegmentsFromRawTicks(rawTicks)
    const priceParams = {
      baseCurrency: USDT,
      quoteCurrency: USDC,
      priceInverted: false,
      protocolVersion: ProtocolVersion.V4,
    }
    const getPrice0 = vi.fn(createDisplayPriceAtTick(priceParams))
    const frame = (offset: number) =>
      buildBucketChartEntries({
        buckets: buildFullGranularityBuckets({
          segments,
          visibleMinTick: -10000 + offset,
          visibleMaxTick: 10000 + offset,
          tickSpacing: 10,
          // 20,000 ticks over a 1,000px-wide chart: a bucket per 2 spacings, ~1,000 buckets.
          ticksPerPixel: 20,
        }),
        liquidityData,
        ...priceParams,
        getPrice0,
      })
    // 2,000 tick spacings are visible, but a frame draws one bar per pixel (plus a partial one at each edge).
    const entries = frame(0)
    expect(entries.length).toBeGreaterThan(900)
    expect(entries.length).toBeLessThanOrEqual(1000 + 2)
    // Each bar's price is read once from the closed-form lookup, never per tick through the SDK.
    expect(getPrice0).toHaveBeenCalledTimes(entries.length)
  })
})

describe('buildBucketChartEntries at full granularity', () => {
  it('sums the same segment amounts from unsorted data as from sorted', () => {
    const { rawTicks, liquidityData } = makeDenseTicks({ count: 200, tickSpacing: 10 })
    const buckets = buildFullGranularityBuckets({
      segments: buildSegmentsFromRawTicks(rawTicks),
      visibleMinTick: -1200,
      visibleMaxTick: 1200,
      tickSpacing: 10,
      ticksPerPixel: 15,
    })
    const params = {
      buckets,
      baseCurrency: USDT,
      quoteCurrency: USDC,
      priceInverted: false,
      protocolVersion: ProtocolVersion.V4,
    }
    // Drop the entry at a segment start so some buckets fall back to the floor entry below it.
    const sorted = liquidityData.filter((e) => e.tick !== 100)
    expect(buildBucketChartEntries({ ...params, liquidityData: sorted })).toEqual(
      // The first two swapped: enough to fall back to the scans.
      buildBucketChartEntries({ ...params, liquidityData: [sorted[1], sorted[0], ...sorted.slice(2)] }),
    )
  })
})

describe('createDisplayPriceAtTick', () => {
  it.each([
    { name: 'USDT/USDC', baseCurrency: USDT, quoteCurrency: USDC, priceInverted: false },
    { name: 'USDC/ETH', baseCurrency: USDC_MAINNET, quoteCurrency: ETH_MAINNET, priceInverted: false },
    { name: 'ETH/USDC inverted', baseCurrency: ETH_MAINNET, quoteCurrency: USDC_MAINNET, priceInverted: true },
  ])('matches the SDK price to 8 significant digits for $name', ({ baseCurrency, quoteCurrency, priceInverted }) => {
    const params = { baseCurrency, quoteCurrency, priceInverted, protocolVersion: ProtocolVersion.V4 }
    const priceAtTick = createDisplayPriceAtTick(params)
    for (const tick of [-887220, -200000, -195960, -60, -1, 0, 1, 61, 12345, 200010, 887220]) {
      const expected = getDisplayPriceFromTick({ tick, ...params })
      expect(expected).toBeDefined()
      const actual = priceAtTick(tick)
      expect(Math.abs((actual ?? 0) - (expected ?? 0)) / (expected ?? 1)).toBeLessThan(2e-7)
    }
  })
})
