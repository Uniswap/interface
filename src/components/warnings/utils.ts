import { Warning, WarningColor, WarningSeverity } from 'src/components/warnings/types'

export function getWarningColor(warning?: Warning): WarningColor {
  if (!warning) return { text: 'none', background: 'none' }

  switch (warning.severity) {
    case WarningSeverity.High:
      return { text: 'accentFailure', background: 'accentFailureSoft' }
    case WarningSeverity.Medium:
      return { text: 'accentWarning', background: 'accentWarningSoft' }
    default:
      return { text: 'none', background: 'none' }
  }
}
