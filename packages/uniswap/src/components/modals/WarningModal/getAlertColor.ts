import { WarningColor, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

export function getAlertColor(severity?: WarningSeverity): WarningColor {
  switch (severity) {
    case WarningSeverity.None:
      return {
        text: '$neutral2',
        headerText: '$neutral1',
        background: '$neutral2',
      }
    case WarningSeverity.Low:
      return {
        text: '$neutral2',
        headerText: '$neutral1',
        background: '$surface2',
      }
    case WarningSeverity.High:
      return {
        text: '$statusCritical',
        headerText: '$statusCritical',
        background: '$statusCritical2',
      }
    case WarningSeverity.Medium:
      return {
        text: '$statusWarning',
        headerText: '$statusWarning',
        background: '$statusWarning2',
      }
    case WarningSeverity.Blocked:
      return {
        text: '$neutral1',
        headerText: '$neutral1',
        background: '$surface3',
      }
    default:
      return {
        text: '$neutral2',
        headerText: '$neutral1',
        background: '$transparent',
      }
  }
}
