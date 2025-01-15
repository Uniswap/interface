import { TickMarkType, UTCTimestamp } from 'lightweight-charts'
import { Trans } from 'react-i18next'

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

export const CHART_TYPE_LABELS: Record<ChartType | PriceChartType, JSX.Element> = {
  [ChartType.PRICE]: <Trans i18nKey="common.price" />,
  [ChartType.VOLUME]: <Trans i18nKey="common.volume" />,
  [ChartType.TVL]: <Trans i18nKey="common.totalValueLocked" />,
  [ChartType.LIQUIDITY]: <Trans i18nKey="common.liquidity" />,
  [PriceChartType.LINE]: <Trans i18nKey="chart.line" />,
  [PriceChartType.CANDLESTICK]: <Trans i18nKey="chart.candlestick" />,
}

/**
 * Custom time formatter used to customize tick mark labels on the time scale.
 * Follows the function signature of lightweight-charts' TickMarkFormatter.
 */
// eslint-disable-next-line consistent-return
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

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii?: number | DOMPointInit | Iterable<number | DOMPointInit> | undefined,
): void {
  // roundRect might need to polyfilled for older browsers
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radii)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
}
