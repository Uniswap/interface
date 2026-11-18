import { opacify } from '@universe/mycelium/theme-hooks-compat'
import { type IPriceLine, type ISeriesApi, LineStyle, type PriceLineOptions, type SeriesType } from 'lightweight-charts'
import { BandsIndicator } from '~/components/Charts/BandsIndicator/bands-indicator'
import type { DraggableRange } from '~/components/Charts/rangeDrag'

export interface RangeBandDrawParams {
  range: DraggableRange
  color: string
  labelTextColor: string
  lowerLabel: string
  upperLabel: string
}

// An open edge's side of the band runs off the pane, as the position chart's does.
const OPEN_LOWER_PRICE = 0
const OPEN_UPPER_PRICE = Number.MAX_SAFE_INTEGER
const BAND_FILL_OPACITY = 12

/** A range drawn across a series: a filled band, and a labelled price line at each bounded edge. */
export class RangeBandOverlay {
  private band: BandsIndicator | undefined
  private lowerLine: IPriceLine | undefined
  private upperLine: IPriceLine | undefined

  constructor(private series: ISeriesApi<SeriesType>) {}

  /**
   * Moves to a replacement series, taking everything off the old one first: removing a series doesn't
   * detach its primitives, so call this while the old series is still on the chart.
   */
  reattach(series: ISeriesApi<SeriesType>): void {
    this.clear()
    this.series = series
  }

  draw({ range: { lower, upper }, color, labelTextColor, lowerLabel, upperLabel }: RangeBandDrawParams): void {
    const bandOptions = {
      // The edges are the price lines below; the band itself is only the fill.
      lineColor: 'transparent',
      lineWidth: 0,
      fillColor: opacify(BAND_FILL_OPACITY, color),
      lowerValue: lower ?? OPEN_LOWER_PRICE,
      upperValue: upper ?? OPEN_UPPER_PRICE,
    }
    if (this.band) {
      this.band.updateOptions(bandOptions)
      this.band.updateAllViews()
    } else {
      this.band = new BandsIndicator(bandOptions)
      this.series.attachPrimitive(this.band)
    }

    const lineOptions = {
      color,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      axisLabelColor: color,
      axisLabelTextColor: labelTextColor,
    } as const
    this.lowerLine = this.upsertLine(
      this.lowerLine,
      lower === undefined ? undefined : { ...lineOptions, price: lower, title: lowerLabel },
    )
    this.upperLine = this.upsertLine(
      this.upperLine,
      upper === undefined ? undefined : { ...lineOptions, price: upper, title: upperLabel },
    )
  }

  clear(): void {
    if (this.band) {
      this.series.detachPrimitive(this.band)
      this.band = undefined
    }
    this.lowerLine = this.upsertLine(this.lowerLine, undefined)
    this.upperLine = this.upsertLine(this.upperLine, undefined)
  }

  private upsertLine(
    line: IPriceLine | undefined,
    options: Partial<PriceLineOptions> | undefined,
  ): IPriceLine | undefined {
    if (!options) {
      if (line) {
        this.series.removePriceLine(line)
      }
      return undefined
    }
    if (line) {
      line.applyOptions(options)
      return line
    }
    return this.series.createPriceLine({ ...options, price: options.price ?? 0 })
  }
}
