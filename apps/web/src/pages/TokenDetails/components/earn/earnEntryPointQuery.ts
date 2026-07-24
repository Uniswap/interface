import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'
import { EARN_ENTRY_POINT_QUERY_PARAM } from 'uniswap/src/utils/linking'

export { EARN_ENTRY_POINT_QUERY_PARAM }
const EARN_ENTRY_POINTS = new Set<string>(Object.values(EarnEntryPoint))

export function parseEarnEntryPointQuery(value: string | null): EarnAnalyticsEntryPoint | undefined {
  return value && EARN_ENTRY_POINTS.has(value) ? (value as EarnAnalyticsEntryPoint) : undefined
}
