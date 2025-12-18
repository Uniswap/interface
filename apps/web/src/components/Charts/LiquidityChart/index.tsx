import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS, tickToPrice } from '@uniswap/v3-sdk'
import { tickToPrice as tickToPriceV4 } from '@uniswap/v4-sdk'
import { ChartHoverData, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { LiquidityBarSeries } from 'components/Charts/LiquidityChart/liquidity-bar-series'
import { LiquidityBarData, LiquidityBarProps, LiquidityBarSeriesOptions } from 'components/Charts/LiquidityChart/types'
import { calculateAnchoredLiquidityByTick } from 'components/Charts/LiquidityChart/utils/calculateAnchoredLiquidityByTick'
import { calculateTokensLocked } from 'components/Charts/LiquidityChart/utils/calculateTokensLocked'
import { usePoolActiveLiquidity } from 'hooks/usePoolTickData'
import JSBI from 'jsbi'
import { ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useState } from 'react'
import { PositionField } from 'types/position'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

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

    const seriesOptions: Partial<LiquidityBarSeriesOptions> = {
      tokenAColor: params.tokenAColor,
      tokenBColor: params.tokenBColor,
      highlightColor: params.highlightColor,
      activeTick: params.activeTick,
      activeTickProgress: params.activeTickProgress,
    }
    this.series.applyOptions(seriesOptions)
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

  const { data: ticksProcessed, activeTick, currentTick, liquidity } = activePoolData

  useEffect(() => {
    async function formatData() {
      if (!ticksProcessed || activeTick === undefined || !liquidity) {
        return
      }

      let activeRangePercentage: number | undefined
      let activeRangeIndex: number | undefined

      // Calculate anchored active liquidity per tick
      const activeLiquidityByTick = calculateAnchoredLiquidityByTick({ ticksProcessed, activeTick, liquidity })
      const poolTickSpacing = tickSpacing ?? TICK_SPACINGS[feeTier]

      const barData: LiquidityBarData[] = []
      for (let index = 0; index < ticksProcessed.length; index++) {
        const t = ticksProcessed[index]

        // Lightweight-charts require the x-axis to be time; a fake time base on index is provided
        const fakeTime = (isReversed ? index * 1000 : (ticksProcessed.length - index) * 1000) as UTCTimestamp
        const isActive = activeTick === t.tick

        let price0 = t.sdkPrice
        let price1 = t.sdkPrice.invert()

        if (isActive && currentTick !== undefined) {
          activeRangeIndex = index
          activeRangePercentage = 1 - (currentTick - t.tick) / poolTickSpacing

          price0 =
            version === ProtocolVersion.V3
              ? tickToPrice(sdkCurrencies.TOKEN0.wrapped, sdkCurrencies.TOKEN1.wrapped, t.tick)
              : tickToPriceV4(sdkCurrencies.TOKEN0, sdkCurrencies.TOKEN1, t.tick)
          price1 = price0.invert()
        }

        const { amount0Locked, amount1Locked } = calculateTokensLocked({
          token0: sdkCurrencies.TOKEN0,
          token1: sdkCurrencies.TOKEN1,
          tickSpacing: poolTickSpacing,
          currentTick: currentTick ?? 0,
          amount: activeLiquidityByTick.get(t.tick) ?? JSBI.BigInt(0),
          tick: t,
        })

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

      const activeRangeData = activeRangeIndex !== undefined ? barData[activeRangeIndex] : undefined

      // Reverse data so that token0 is on the left by default
      if (!isReversed) {
        barData.reverse()
      }
      setTickData({ barData, activeRangeData, activeRangePercentage })
    }

    formatData()
  }, [
    ticksProcessed,
    activeTick,
    currentTick,
    liquidity,
    sdkCurrencies,
    formatNumberOrString,
    isReversed,
    feeTier,
    version,
    tickSpacing,
  ])

  return { tickData, activeTick: activePoolData.activeTick, loading: activePoolData.isLoading || !tickData }
}
