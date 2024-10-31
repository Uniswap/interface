import { WarningColor, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

export function getAlertColor(severity?: WarningSeverity): WarningColor {
  switch (severity) {
    case WarningSeverity.None:
      return {
        text: '$neutral2',
        background: '$neutral2',
        buttonTheme: 'secondary',
      }
    case WarningSeverity.Low:
      return {
        text: '$neutral2',
        background: '$surface2',
        buttonTheme: 'tertiary',
      }
    case WarningSeverity.High:
      return {
        text: '$statusCritical',
        background: '$DEP_accentCriticalSoft',
        buttonTheme: 'detrimental',
      }
    case WarningSeverity.Medium:
      return {
        text: '$DEP_accentWarning',
        background: '$DEP_accentWarningSoft',
        buttonTheme: 'warning',
      }
    case WarningSeverity.Blocked:
      return {
        text: '$neutral1',
        background: '$surface3',
        buttonTheme: 'secondary',
      }
    default:
      return {
        text: '$neutral2',
        background: '$transparent',
        buttonTheme: 'tertiary',
      }
  }
}
