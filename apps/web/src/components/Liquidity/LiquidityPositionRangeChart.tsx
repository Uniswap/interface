// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { BandsIndicator } from 'components/Charts/BandsIndicator/bands-indicator'
import { cloneReadonly } from 'components/Charts/BandsIndicator/helpers/simple-clone'
import { Chart, ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { PriceChartData } from 'components/Charts/PriceChart'
import { PriceChartType } from 'components/Charts/utils'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { PositionInfo } from 'components/Liquidity/types'
import { DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { useTheme } from 'lib/styled-components'
import { CrosshairMode, ISeriesApi, LineStyle, LineType, UTCTimestamp } from 'lightweight-charts'
import { getCurrencyAddressWithWrap, getSortedCurrenciesTupleWithWrap } from 'pages/Pool/Positions/create/utils'
import { useMemo, useState } from 'react'
import { opacify } from 'theme/utils'
import { Flex, FlexProps } from 'ui/src'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

const CHART_HEIGHT = 52
const CHART_WIDTH = 224

const pulseKeyframe = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(5);
      opacity: 0;
    }
  }
`

function getCrosshairProps(color: any, yCoordinate: number): FlexProps {
  // The chart extends by a constant amount horizontally past the price data.
  return {
    position: 'absolute',
    right: 19,
    top: yCoordinate - 3, // Center the crosshair vertically on the price line.
    width: 6,
    height: 6,
    borderRadius: '$roundedFull',
    backgroundColor: color,
  }
}

interface LPPriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType.LINE
  positionInfo: PositionInfo
  positionPriceLower?: Price<Currency, Currency>
  positionPriceUpper?: Price<Currency, Currency>
  setCrosshairYCoordinate: (xCoordinate: number) => void
}

class LPPriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area'>
  private rangeBandSeries: ISeriesApi<'Line'>
  private extendedData: PriceChartData[]
  private positionRangeMin: number
  private positionRangeMax: number

  constructor(chartDiv: HTMLDivElement, params: LPPriceChartModelParams) {
    super(chartDiv, params)

    this.positionRangeMin = Number(
      params.positionPriceLower
        ?.quote(
          CurrencyAmount.fromRawAmount(
            params.positionPriceLower.baseCurrency,
            Math.pow(10, params.positionPriceLower.baseCurrency.decimals),
          ),
        )
        ?.toSignificant(params.positionPriceLower.baseCurrency.decimals) ?? 0,
    )
    this.positionRangeMax = Number(
      params.positionPriceUpper
        ?.quote(
          CurrencyAmount.fromRawAmount(
            params.positionPriceUpper.baseCurrency,
            Math.pow(10, params.positionPriceUpper.baseCurrency.decimals),
          ),
        )
        ?.toSignificant(params.positionPriceUpper.baseCurrency.decimals) ?? 0,
    )

    // Price history (primary series)
    this.series = this.api.addAreaSeries()
    this.series.setData(this.data)

    this.extendedData = LPPriceChartModel.generateExtendedData(this.data)
    this.rangeBandSeries = this.api.addLineSeries()
    // The price values in the data are ignored by this Series,
    // it only uses the time values to make the BandsIndicator work.
    this.rangeBandSeries.setData(this.extendedData)

    this.rangeBandSeries.applyOptions({
      priceLineVisible: false,
      color: 'transparent',
    })

    const bandIndicator = new BandsIndicator({
      lineColor: opacify(10, params.theme.neutral1),
      fillColor: params.theme.surface3,
      lineWidth: 1,
      upperValue: this.positionRangeMax,
      lowerValue: this.positionRangeMin,
    })
    this.rangeBandSeries.attachPrimitive(bandIndicator)

    this.updateOptions(params)
    this.fitContent()
    this.overrideCrosshair(params)
  }

  updateOptions(params: LPPriceChartModelParams): void {
    // Handle changes in data
    if (this.data !== params.data) {
      this.data = params.data
      this.series.setData(this.data)
      this.extendedData = LPPriceChartModel.generateExtendedData(this.data)
      this.rangeBandSeries.setData(this.extendedData)
      this.fitContent()
      this.overrideCrosshair(params)
    }

    super.updateOptions(params, {
      rightPriceScale: {
        visible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        mode: CrosshairMode.Hidden,
      },
    })

    // Re-set options that depend on data.
    const priceLineColor = LPPriceChartModel.getPriceLineColor(params)
    this.series.applyOptions({
      priceLineVisible: true,
      priceLineStyle: LineStyle.SparseDotted,
      lineType: this.data.length < 20 ? LineType.WithSteps : LineType.Curved,
      lineWidth: 2,
      lineColor: priceLineColor,
      topColor: 'transparent',
      bottomColor: 'transparent',
    })
  }

  public static getPriceLineColor(params: Pick<LPPriceChartModelParams, 'positionInfo' | 'theme'>): string {
    switch (params.positionInfo.status) {
      case PositionStatus.OUT_OF_RANGE:
        return params.theme.critical
      case PositionStatus.IN_RANGE:
        return params.theme.success
      case PositionStatus.CLOSED:
      default:
        return params.theme.neutral2
    }
  }

  private overrideCrosshair(params: LPPriceChartModelParams): void {
    const lastDataPoint = this.data[this.data.length - 1]
    if (!lastDataPoint) {
      return
    }

    const yCoordinate = this.series.priceToCoordinate(lastDataPoint.value)
    params.setCrosshairYCoordinate(Number(yCoordinate))
  }

  private static generateExtendedData(data: PriceChartData[]): PriceChartData[] {
    const lastTime = data[data.length - 1]?.time
    if (!lastTime) {
      return data
    }
    const timeDelta = lastTime - data[0]?.time
    const timeIncrement = timeDelta / data.length

    if (timeIncrement === 0) {
      return data
    }

    const newData = cloneReadonly(data)
    const lastData = newData[newData.length - 1]

    for (let i = 1; i <= Math.floor(data.length / 10); i++) {
      const time = lastTime + timeIncrement * i
      newData.push({
        ...lastData,
        time: time as UTCTimestamp,
      })
    }
    return newData
  }
}

interface LiquidityPositionRangeChartProps {
  positionInfo: PositionInfo
}

export function LiquidityPositionRangeChart({ positionInfo }: LiquidityPositionRangeChartProps) {
  const { priceOrdering } = useV3OrV4PositionDerivedInfo(positionInfo)
  const theme = useTheme()
  const isV2 = positionInfo.version === ProtocolVersion.V2
  const isV3 = positionInfo.version === ProtocolVersion.V3
  const isV4 = positionInfo.version === ProtocolVersion.V4
  const chainInfo = getChainInfo(positionInfo.currency0Amount.currency.chainId)
  const poolAddressOrId = isV2 ? positionInfo.pair?.liquidityToken.address : positionInfo.poolId
  const variables = poolAddressOrId
    ? {
        addressOrId: poolAddressOrId,
        chain: chainInfo.backendChain.chain,
        duration: HistoryDuration.Month,
        isV4,
        isV3,
        isV2,
      }
    : undefined
  const sortedCurrencies = getSortedCurrenciesTupleWithWrap(
    positionInfo.currency0Amount.currency,
    positionInfo.currency1Amount.currency,
    positionInfo.version,
  )
  const priceData = usePoolPriceChartData(
    variables,
    positionInfo.currency0Amount.currency,
    positionInfo.currency0Amount.currency,
    positionInfo.version,
    getCurrencyAddressWithWrap(sortedCurrencies[0], positionInfo.version),
    priceOrdering.base?.equals(sortedCurrencies[0]) ?? false /* isReversed */,
  )

  const [crosshairYCoordinate, setCrosshairYCoordinate] = useState<number>()

  const chartParams = useMemo(() => {
    return {
      data: priceData.entries,
      stale: priceData.dataQuality === DataQuality.STALE,
      type: PriceChartType.LINE,
      positionInfo,
      positionPriceLower: priceOrdering.priceLower,
      positionPriceUpper: priceOrdering.priceUpper,
      setCrosshairYCoordinate,
    } as const
  }, [priceData.dataQuality, priceData.entries, positionInfo, priceOrdering.priceLower, priceOrdering.priceUpper])

  return (
    <Flex height={CHART_HEIGHT} width={CHART_WIDTH}>
      <Chart Model={LPPriceChartModel} params={chartParams} height={CHART_HEIGHT} />
      <style>{pulseKeyframe}</style>
      {crosshairYCoordinate && crosshairYCoordinate > 5 && (
        <>
          <Flex
            {...getCrosshairProps(LPPriceChartModel.getPriceLineColor({ positionInfo, theme }), crosshairYCoordinate)}
          />
          <Flex
            {...getCrosshairProps(LPPriceChartModel.getPriceLineColor({ positionInfo, theme }), crosshairYCoordinate)}
            style={{
              animation: 'pulse 1.5s linear infinite',
            }}
          />
        </>
      )}
    </Flex>
  )
}
