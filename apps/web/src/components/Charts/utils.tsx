import { TickMarkType, UTCTimestamp } from 'lightweight-charts'

/** Compatible with ISeriesApi<'Area' | 'Candlestick'> */
export enum PriceChartType {
  LINE = 'Line chart',
  CANDLESTICK = 'Candlestick',
}

export enum ChartType {
  PRICE = 'Price',
  VOLUME = 'Volume',
  TVL = 'TVL', // Locked value distributed by timestamp
  LIQUIDITY = 'Liquidity', // Locked value distributed by tick
}

/**
 * Custom time formatter used to customize tick mark labels on the time scale.
 * Follows the function signature of lightweight-charts' TickMarkFormatter.
 */
// eslint-disable-next-line consistent-return, max-params
export function formatTickMarks(time: UTCTimestamp, tickMarkType: TickMarkType, locale: string): string {
  const date = new Date(time.valueOf() * 1000)
  switch (tickMarkType) {
    case TickMarkType.Year:
      return date.toLocaleString(locale, { year: 'numeric' })
    case TickMarkType.Month:
      return date.toLocaleString(locale, { month: 'short', year: 'numeric' })
    case TickMarkType.DayOfMonth:
      return date.toLocaleString(locale, { month: 'short', day: 'numeric' })
    case TickMarkType.Time:
      return date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric' })
    case TickMarkType.TimeWithSeconds:
      return date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric', second: '2-digit' })
  }
}

export function roundRect({
  ctx,
  x,
  y,
  w,
  h,
  radii,
}: {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  w: number
  h: number
  radii?: number | DOMPointInit | Iterable<number | DOMPointInit>
}): void {
  // roundRect might need to polyfilled for older browsers
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radii)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
}
