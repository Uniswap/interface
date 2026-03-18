import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { USDC, USDC_MAINNET, USDT } from 'uniswap/src/constants/tokens'
import { ETH } from 'uniswap/src/test/fixtures/lib/sdk'
import {
  buildBucketChartEntries,
  buildBuckets,
  buildSegmentsFromRawTicks,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/liquidityBucketing/liquidityBucketing'
import {
  SORTED_TICK_DATA_WITH_LIQUIDITY_ACTIVE,
  TICK_DATA,
  TICK_DATA_WITH_ONE_TICK_AND_ONE_FULL_RANGE,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/liquidityBucketing/mocks/tickData'
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
        amount0Locked: 8.411022058540207e24,
        amount1Locked: 464686.23114,
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
})
