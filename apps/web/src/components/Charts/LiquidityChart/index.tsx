import { BigNumber } from '@ethersproject/bignumber'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool as PoolV3, TICK_SPACINGS, TickMath as TickMathV3, tickToPrice } from '@uniswap/v3-sdk'
import { Pool as PoolV4, tickToPrice as tickToPriceV4 } from '@uniswap/v4-sdk'
import { ChartHoverData, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { LiquidityBarSeries } from 'components/Charts/LiquidityChart/liquidity-bar-series'
import { LiquidityBarData, LiquidityBarProps, LiquidityBarSeriesOptions } from 'components/Charts/LiquidityChart/types'
import { usePoolActiveLiquidity } from 'hooks/usePoolTickData'
import JSBI from 'jsbi'
import { ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useState } from 'react'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { TickProcessed } from 'utils/computeSurroundingTicks'

interface LiquidityBarChartModelParams extends ChartModelParams<LiquidityBarData>, LiquidityBarProps {}

export class LiquidityBarChartModel extends ChartModel<LiquidityBarData> {
  protected series: ISeriesApi<'Custom'>
  private activeTick?: number

  constructor(chartDiv: HTMLDivElement, params: LiquidityBarChartModelParams) {
    super(chartDiv, params)
    this.series = this.api.addCustomSeries(new LiquidityBarSeries(params))

    this.series.setData(this.data)

    this.updateOptions(params)
    this.fitContent()
  }

  updateOptions(params: LiquidityBarChartModelParams) {
    super.updateOptions(params, {
      localization: {
        locale: params.locale,
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
        scaleMargins: {
          top: 0.35,
          bottom: 0,
        },
        autoScale: true,
      },
      timeScale: {
        visible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        borderVisible: false,
      },
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
        vertLine: {
          visible: false,
          labelVisible: false,
        },
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
    })
    const { data, activeTick } = params

    this.activeTick = activeTick

    if (this.data !== data) {
      this.data = data
      this.series.setData(data)
      this.fitContent()
    }

    this.series.applyOptions({
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      lastValueVisible: false,
    })

    this.series.applyOptions(params)
  }

  override onSeriesHover(hoverData?: ChartHoverData<LiquidityBarData>) {
    super.onSeriesHover(hoverData)
    const updatedOptions: Partial<LiquidityBarSeriesOptions> = { hoveredTick: hoverData?.item.tick ?? this.activeTick }
    this.series.applyOptions(updatedOptions)
  }

  activeTickIndex() {
    return this.data.findIndex((bar) => bar.tick === this.activeTick)
  }

  fitContent() {
    const length = this.data.length
    const activeTickIndex = this.data.findIndex((bar) => bar.tick === this.activeTick)
    const midPoint = activeTickIndex !== -1 ? activeTickIndex : length / 2

    this.api
      .timeScale()
      .setVisibleLogicalRange({ from: Math.max(midPoint - 50, 0), to: Math.min(midPoint + 50, this.data.length) })
  }
}

const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1)

function maxAmount(token: Token) {
  return CurrencyAmount.fromRawAmount(token, MAX_UINT128.toString())
}

/** Calculates tokens locked in the active tick range based on the current tick */
// TODO(WEB-7564): determine how to support v4
async function calculateActiveRangeTokensLocked({
  token0,
  token1,
  feeTier,
  tick,
  poolData,
}: {
  token0: Token
  token1: Token
  feeTier: FeeAmount
  tick: TickProcessed
  poolData: {
    sqrtPriceX96?: JSBI
    currentTick?: number
    liquidity?: JSBI
  }
}): Promise<{ amount0Locked: number; amount1Locked: number } | undefined> {
  if (!poolData.currentTick || !poolData.sqrtPriceX96 || !poolData.liquidity) {
    return undefined
  }

  try {
    const liqGross = JSBI.greaterThan(tick.liquidityNet, JSBI.BigInt(0))
      ? tick.liquidityNet
      : JSBI.multiply(tick.liquidityNet, JSBI.BigInt('-1'))

    const mockTicks = [
      {
        index: tick.tick,
        liquidityGross: liqGross,
        liquidityNet: JSBI.multiply(tick.liquidityNet, JSBI.BigInt('-1')),
      },
      {
        index: tick.tick + TICK_SPACINGS[feeTier],
        liquidityGross: liqGross,
        liquidityNet: tick.liquidityNet,
      },
    ]
    // Initialize pool containing only the active range
    const pool1 = new PoolV3(
      token0,
      token1,
      feeTier,
      poolData.sqrtPriceX96,
      tick.liquidityActive,
      poolData.currentTick,
      mockTicks,
    )
    // Calculate amount of token0 that would need to be swapped to reach the bottom of the range
    const bottomOfRangePrice = TickMathV3.getSqrtRatioAtTick(mockTicks[0].index)
    const token1Amount = (await pool1.getOutputAmount(maxAmount(token0), bottomOfRangePrice))[0]
    const amount0Locked = parseFloat(tick.sdkPrice.invert().quote(token1Amount).toExact())

    // Calculate amount of token1 that would need to be swapped to reach the top of the range
    const topOfRangePrice = TickMathV3.getSqrtRatioAtTick(mockTicks[1].index)
    const token0Amount = (await pool1.getOutputAmount(maxAmount(token1), topOfRangePrice))[0]
    const amount1Locked = parseFloat(tick.sdkPrice.quote(token0Amount).toExact())

    return { amount0Locked, amount1Locked }
  } catch {
    return { amount0Locked: 0, amount1Locked: 0 }
  }
}

/** Returns amounts of tokens locked in the given tick. Reference: https://docs.uniswap.org/sdk/v3/guides/advanced/active-liquidity */
export async function calculateTokensLockedV3({
  token0,
  token1,
  feeTier,
  tick,
}: {
  token0: Token
  token1: Token
  feeTier: FeeAmount
  tick: TickProcessed
}): Promise<{ amount0Locked: number; amount1Locked: number }> {
  try {
    const tickSpacing = TICK_SPACINGS[feeTier]
    const liqGross = JSBI.greaterThan(tick.liquidityNet, JSBI.BigInt(0))
      ? tick.liquidityNet
      : JSBI.multiply(tick.liquidityNet, JSBI.BigInt('-1'))

    const sqrtPriceX96 = TickMathV3.getSqrtRatioAtTick(tick.tick)
    const mockTicks = [
      {
        index: tick.tick,
        liquidityGross: liqGross,
        liquidityNet: JSBI.multiply(tick.liquidityNet, JSBI.BigInt('-1')),
      },
      {
        index: tick.tick + TICK_SPACINGS[feeTier],
        liquidityGross: liqGross,
        liquidityNet: tick.liquidityNet,
      },
    ]

    // Initialize pool containing only the current range
    const pool = new PoolV3(token0, token1, Number(feeTier), sqrtPriceX96, tick.liquidityActive, tick.tick, mockTicks)

    // Calculate token amounts that would need to be swapped to reach the next range
    const nextSqrtX96 = TickMathV3.getSqrtRatioAtTick(tick.tick - tickSpacing)
    const maxAmountToken0 = CurrencyAmount.fromRawAmount(token0, MAX_UINT128.toString())
    const token1Amount = (await pool.getOutputAmount(maxAmountToken0, nextSqrtX96))[0]
    const amount0Locked = parseFloat(tick.sdkPrice.invert().quote(token1Amount).toExact())
    const amount1Locked = parseFloat(token1Amount.toExact())

    return { amount0Locked, amount1Locked }
  } catch {
    return { amount0Locked: 0, amount1Locked: 0 }
  }
}

// TODO(WEB-7564): determine if tick math needs to be converted to support v4
export async function calculateTokensLockedV4({
  token0,
  token1,
  feeTier,
  tickSpacing,
  hooks,
  tick,
}: {
  token0: Currency
  token1: Currency
  feeTier: FeeAmount
  tickSpacing: number
  hooks: string
  tick: TickProcessed
}): Promise<{ amount0Locked: number; amount1Locked: number }> {
  try {
    const liqGross = JSBI.greaterThan(tick.liquidityNet, JSBI.BigInt(0))
      ? tick.liquidityNet
      : JSBI.multiply(tick.liquidityNet, JSBI.BigInt('-1'))

    const sqrtPriceX96 = TickMathV3.getSqrtRatioAtTick(tick.tick)
    const mockTicks = [
      {
        index: tick.tick,
        liquidityGross: liqGross,
        liquidityNet: JSBI.multiply(tick.liquidityNet, JSBI.BigInt('-1')),
      },
      {
        index: tick.tick + tickSpacing,
        liquidityGross: liqGross,
        liquidityNet: tick.liquidityNet,
      },
    ]

    // Initialize pool containing only the current range
    const pool = new PoolV4(
      token0,
      token1,
      Number(feeTier),
      tickSpacing,
      hooks,
      sqrtPriceX96,
      tick.liquidityActive,
      tick.tick,
      mockTicks,
    )

    // Calculate token amounts that would need to be swapped to reach the next range
    const nextSqrtX96 = TickMathV3.getSqrtRatioAtTick(tick.tick - tickSpacing)
    const maxAmountToken0 = CurrencyAmount.fromRawAmount(token0, MAX_UINT128.toString())
    const token1Amount = (await pool.getOutputAmount(maxAmountToken0, nextSqrtX96))[0]
    const amount0Locked = parseFloat(tick.sdkPrice.invert().quote(token1Amount).toExact())
    const amount1Locked = parseFloat(token1Amount.toExact())

    return { amount0Locked, amount1Locked }
  } catch {
    return { amount0Locked: 0, amount1Locked: 0 }
  }
}

export function useLiquidityBarData({
  sdkCurrencies,
  feeTier,
  isReversed,
  chainId,
  version,
  tickSpacing,
  hooks,
  poolId,
}: {
  sdkCurrencies: { [field in PositionField]: Currency }
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: ProtocolVersion
  tickSpacing?: number
  hooks?: string
  poolId?: string
}) {
  const { formatNumberOrString } = useLocalizationContext()

  const activePoolData = usePoolActiveLiquidity({
    sdkCurrencies,
    feeAmount: feeTier,
    version,
    poolId,
    chainId,
    tickSpacing: tickSpacing ?? TICK_SPACINGS[feeTier],
    hooks,
  })

  const [tickData, setTickData] = useState<{
    barData: LiquidityBarData[]
    activeRangeData?: LiquidityBarData
    activeRangePercentage?: number
  }>()

  const { data: ticksProcessed, activeTick, currentTick, liquidity, sqrtPriceX96 } = activePoolData

  useEffect(() => {
    async function formatData() {
      if (!ticksProcessed) {
        return
      }

      let activeRangePercentage: number | undefined
      let activeRangeIndex: number | undefined

      const barData: LiquidityBarData[] = []
      for (let index = 0; index < ticksProcessed.length; index++) {
        const t = ticksProcessed[index]

        // Lightweight-charts require the x-axis to be time; a fake time base on index is provided
        const fakeTime = (isReversed ? index * 1000 : (ticksProcessed.length - index) * 1000) as UTCTimestamp
        const isActive = activeTick === t.tick

        let price0 = t.sdkPrice
        let price1 = t.sdkPrice.invert()

        if (isActive && activeTick && currentTick) {
          activeRangeIndex = index
          activeRangePercentage = (currentTick - t.tick) / TICK_SPACINGS[feeTier]

          price0 =
            version === ProtocolVersion.V3
              ? tickToPrice(sdkCurrencies.TOKEN0.wrapped, sdkCurrencies.TOKEN1.wrapped, t.tick)
              : tickToPriceV4(sdkCurrencies.TOKEN0, sdkCurrencies.TOKEN1, t.tick)
          price1 = price0.invert()
        }

        const { amount0Locked, amount1Locked } = await (version === ProtocolVersion.V3
          ? calculateTokensLockedV3({
              token0: sdkCurrencies.TOKEN0.wrapped,
              token1: sdkCurrencies.TOKEN1.wrapped,
              feeTier,
              tick: t,
            })
          : calculateTokensLockedV4({
              token0: sdkCurrencies.TOKEN0,
              token1: sdkCurrencies.TOKEN1,
              feeTier,
              tickSpacing: tickSpacing ?? TICK_SPACINGS[feeTier],
              hooks: hooks ?? ZERO_ADDRESS,
              tick: t,
            }))

        barData.push({
          tick: t.tick,
          liquidity: parseFloat(t.liquidityActive.toString()),
          price0: formatNumberOrString({ value: price0.toSignificant(), type: NumberType.SwapTradeAmount }),
          price1: formatNumberOrString({ value: price1.toSignificant(), type: NumberType.SwapTradeAmount }),
          time: fakeTime,
          amount0Locked,
          amount1Locked,
        })
      }

      // offset the values to line off bars with TVL used to swap across bar
      barData.map((entry, i) => {
        if (i > 0) {
          barData[i - 1].amount0Locked = entry.amount0Locked
          barData[i - 1].amount1Locked = entry.amount1Locked
        }
      })

      const activeRangeData = activeRangeIndex !== undefined ? barData[activeRangeIndex] : undefined
      // For active range, adjust amounts locked to adjust for where current tick/price is within the range
      if (activeRangeIndex !== undefined && activeRangeData) {
        const activeTickTvl = await calculateActiveRangeTokensLocked({
          token0: sdkCurrencies.TOKEN0.wrapped,
          token1: sdkCurrencies.TOKEN1.wrapped,
          feeTier,
          tick: ticksProcessed[activeRangeIndex],
          poolData: { currentTick, liquidity, sqrtPriceX96 },
        })
        barData[activeRangeIndex] = { ...activeRangeData, ...activeTickTvl }
      }

      // Reverse data so that token0 is on the left by default
      if (!isReversed) {
        barData.reverse()
      }

      // TODO(WEB-3672): investigate why negative/inaccurate liquidity values that are appearing from computeSurroundingTicks
      setTickData({ barData: barData.filter((t) => t.liquidity > 0), activeRangeData, activeRangePercentage })
    }

    formatData()
  }, [
    ticksProcessed,
    activeTick,
    currentTick,
    liquidity,
    sqrtPriceX96,
    sdkCurrencies,
    formatNumberOrString,
    isReversed,
    feeTier,
    version,
    tickSpacing,
    hooks,
  ])

  return { tickData, activeTick: activePoolData.activeTick, loading: activePoolData.isLoading || !tickData }
}
