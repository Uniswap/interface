import type { UTCTimestamp } from 'lightweight-charts'
import { HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from 'utilities/src/time/time'
import type { PriceChartData } from '~/components/Charts/PriceChart'

const MINUTE = SECONDS_IN_MINUTE
const HOUR = MINUTES_IN_HOUR * MINUTE
const DAY = HOURS_IN_DAY * HOUR
const WEEK = 7 * DAY

export type CandleIntervalUnit = 'minutes' | 'hours' | 'days' | 'weeks'

export type CandleInterval = {
  /** Stable id, also what the selector stores, e.g. `15m`, `4h`, `30d`. */
  id: string
  seconds: number
  unit: CandleIntervalUnit
  count: number
  /** Bucket starts sit at `offset + k * seconds` (epoch seconds). */
  offset: number
}

/**
 * Candle widths on offer, finest first. Weeks start on Monday 00:00 UTC (the epoch fell on a Thursday). The
 * longest is a fixed 30 days from the epoch rather than a calendar month, so it's labelled `30d`: its candles
 * start on arbitrary dates.
 */
export const CANDLE_INTERVALS: readonly CandleInterval[] = [
  { id: '1m', seconds: MINUTE, unit: 'minutes', count: 1, offset: 0 },
  { id: '5m', seconds: 5 * MINUTE, unit: 'minutes', count: 5, offset: 0 },
  { id: '15m', seconds: 15 * MINUTE, unit: 'minutes', count: 15, offset: 0 },
  { id: '30m', seconds: 30 * MINUTE, unit: 'minutes', count: 30, offset: 0 },
  { id: '1h', seconds: HOUR, unit: 'hours', count: 1, offset: 0 },
  { id: '4h', seconds: 4 * HOUR, unit: 'hours', count: 4, offset: 0 },
  { id: '8h', seconds: 8 * HOUR, unit: 'hours', count: 8, offset: 0 },
  { id: '1d', seconds: DAY, unit: 'days', count: 1, offset: 0 },
  { id: '1w', seconds: WEEK, unit: 'weeks', count: 1, offset: 4 * DAY },
  { id: '30d', seconds: 30 * DAY, unit: 'days', count: 30, offset: 0 },
]

const MIN_CANDLES = 10
// A year of daily candles still reads at the chart's width; much past that they thin to hairlines.
const MAX_CANDLES = 400
const TARGET_CANDLES = 50

/** The series' sampling step: the median gap, since the trailing live-price point sits off the grid. */
export function getSeriesResolution(entries: readonly { time: number }[]): number | undefined {
  const steps: number[] = []
  for (let i = 1; i < entries.length; i++) {
    const step = entries[i].time - entries[i - 1].time
    if (step > 0) {
      steps.push(step)
    }
  }
  if (steps.length === 0) {
    return undefined
  }
  steps.sort((a, b) => a - b)
  return steps[Math.floor(steps.length / 2)]
}

/**
 * The intervals worth offering for a series, finest first: no finer than its sampling, and either a whole
 * multiple of it (each candle takes the same number of samples) or at least four samples wide (counts can differ
 * by one, which barely shows at that width), and giving a readable number of candles across its span.
 * If none fits the count, the finest interval the sampling allows, so candles can always be drawn.
 */
export function getCandleIntervalOptions(entries: readonly { time: number }[]): CandleInterval[] {
  const resolution = getSeriesResolution(entries)
  if (resolution === undefined) {
    return []
  }
  const span = entries[entries.length - 1].time - entries[0].time
  const buildable = CANDLE_INTERVALS.filter(
    ({ seconds }) => seconds >= resolution && (seconds % resolution === 0 || seconds >= 4 * resolution),
  )
  const readable = buildable.filter(({ seconds }) => {
    const candles = span / seconds
    return candles >= MIN_CANDLES && candles <= MAX_CANDLES
  })
  return readable.length > 0 ? readable : buildable.slice(0, 1)
}

/** The option giving closest to `TARGET_CANDLES` across the series' span. */
export function getDefaultCandleInterval(
  options: readonly CandleInterval[],
  entries: readonly { time: number }[],
): CandleInterval | undefined {
  if (entries.length === 0) {
    return options[0]
  }
  const span = entries[entries.length - 1].time - entries[0].time
  let best: CandleInterval | undefined
  let bestDistance = Infinity
  for (const option of options) {
    const distance = Math.abs(span / option.seconds - TARGET_CANDLES)
    if (distance < bestDistance) {
      best = option
      bestDistance = distance
    }
  }
  return best
}

function getBucketStart(time: number, { seconds, offset }: CandleInterval): number {
  return Math.floor((time - offset) / seconds) * seconds + offset
}

/**
 * Buckets a price series (time-ordered samples) into OHLC candles, each stamped with its bucket's start.
 * The series is sampled prices rather than trades, so a candle opens at the previous candle's close (the
 * last known price as the bucket began) and its high and low take that in; the first candle opens at its
 * first sample. Close is the bucket's last sample, so the last candle closes at the series' latest price.
 */
export function buildCandles(entries: readonly PriceChartData[], interval: CandleInterval): PriceChartData[] {
  const candles: PriceChartData[] = []
  let current: PriceChartData | undefined
  for (const entry of entries) {
    const price = entry.close
    const bucketStart = getBucketStart(entry.time, interval)
    if (current && current.time === bucketStart) {
      current.high = Math.max(current.high, price)
      current.low = Math.min(current.low, price)
      current.close = price
      current.value = price
      continue
    }
    const open = current?.close ?? price
    current = {
      time: bucketStart as UTCTimestamp,
      open,
      high: Math.max(open, price),
      low: Math.min(open, price),
      close: price,
      value: price,
    }
    candles.push(current)
  }
  return candles
}
