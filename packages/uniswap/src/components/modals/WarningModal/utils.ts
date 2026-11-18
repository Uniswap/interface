import type { WarningLevel } from '@universe/transactions-ui'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

const SEVERITY_TO_LEVEL: Record<WarningSeverity, WarningLevel | undefined> = {
  [WarningSeverity.None]: undefined,
  [WarningSeverity.Low]: 'info',
  [WarningSeverity.Medium]: 'warning',
  [WarningSeverity.High]: 'critical',
  [WarningSeverity.Blocked]: 'blocked',
}

/** Maps a uniswap severity onto the transactions-ui level. None has no level: views render their neutral color. */
export function toWarningLevel(severity: WarningSeverity): WarningLevel | undefined {
  return SEVERITY_TO_LEVEL[severity]
}
