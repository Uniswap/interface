import type { ColorTokens } from '@universe/mycelium'

/**
 * How a warning looks to the user. Adapters map uniswap's WarningSeverity with
 * toWarningLevel: Low is `info`, Medium is `warning`, High is `critical`, Blocked is
 * `blocked`, None is no level at all.
 *
 * `critical` is red but not necessarily final: high price impact still allows "Swap
 * anyway". `blocked` means the action cannot continue. Ordering stays in the uniswap
 * enum, where business logic picks which warning to show; views never compare levels.
 */
export type WarningLevel = 'info' | 'warning' | 'critical' | 'blocked'

// Mirrors the `text` column of uniswap getAlertColor. Pinned by WarningModal/utils.test.ts
// on the uniswap side.
const WARNING_LEVEL_TEXT_COLOR = {
  info: '$neutral2',
  warning: '$statusWarning',
  critical: '$statusCritical',
  blocked: '$neutral1',
} as const satisfies Record<WarningLevel, ColorTokens>

export type WarningLevelTextColor = (typeof WARNING_LEVEL_TEXT_COLOR)[WarningLevel]

/** Text and icon color for a value or line that carries a warning level, e.g. price impact. */
export function getWarningLevelTextColor(level: WarningLevel): WarningLevelTextColor {
  return WARNING_LEVEL_TEXT_COLOR[level]
}
