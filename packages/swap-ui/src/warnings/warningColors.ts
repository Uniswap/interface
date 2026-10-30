import type { ColorTokens } from '@universe/mycelium'
import type { SwapWarningSeverity } from '../types'

// Mirrors the `text` column of uniswap getAlertColor so severity, not a color token,
// crosses the package boundary. Pinned by WarningModal/utils.test.ts on the uniswap side.
const WARNING_TEXT_COLOR = {
  none: '$neutral2',
  low: '$neutral2',
  medium: '$statusWarning',
  high: '$statusCritical',
  blocked: '$neutral1',
} as const satisfies Record<SwapWarningSeverity, ColorTokens>

export type WarningTextColor = (typeof WARNING_TEXT_COLOR)[SwapWarningSeverity]

export function getWarningTextColor(severity: SwapWarningSeverity): WarningTextColor {
  return WARNING_TEXT_COLOR[severity]
}
