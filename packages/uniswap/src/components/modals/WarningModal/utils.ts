import type { SwapWarningDisplay, SwapWarningSeverity } from '@universe/swap-ui'
import { type Warning, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

const SEVERITY_TO_DISPLAY: Record<WarningSeverity, SwapWarningSeverity> = {
  [WarningSeverity.None]: 'none',
  [WarningSeverity.Low]: 'low',
  [WarningSeverity.Medium]: 'medium',
  [WarningSeverity.High]: 'high',
  [WarningSeverity.Blocked]: 'blocked',
}

export function toSwapWarningSeverity(severity: WarningSeverity): SwapWarningSeverity {
  return SEVERITY_TO_DISPLAY[severity]
}

/** Decomposes a uniswap Warning into the swap-ui display shape. Only what a view renders crosses. */
export function toSwapWarningDisplay(warning: Warning): SwapWarningDisplay {
  return { severity: toSwapWarningSeverity(warning.severity) }
}
