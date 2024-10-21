import { ColorTokens, GeneratedIcon } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Blocked } from 'ui/src/components/icons/Blocked'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { OctagonExclamation } from 'ui/src/components/icons/OctagonExclamation'
import { ThemeNames } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function safetyLevelToWarningSeverity(safetyLevel: Maybe<SafetyLevel>): WarningSeverity {
  switch (safetyLevel) {
    case SafetyLevel.Blocked:
      return WarningSeverity.Blocked
    case SafetyLevel.Verified:
      return WarningSeverity.None
    case SafetyLevel.StrongWarning:
      return WarningSeverity.High
    case SafetyLevel.MediumWarning:
    default:
      return WarningSeverity.Medium
  }
}

export function getWarningIcon(severity?: WarningSeverity, tokenProtectionEnabled: boolean = false): GeneratedIcon {
  switch (severity) {
    case WarningSeverity.High:
      return tokenProtectionEnabled ? OctagonExclamation : AlertTriangleFilled
    case WarningSeverity.Medium:
      return AlertTriangleFilled
    case WarningSeverity.Blocked:
      return Blocked
    case WarningSeverity.Low:
    case WarningSeverity.None:
      return InfoCircleFilled
    default:
      return AlertTriangleFilled
  }
}

export function getWarningIconColors(severity?: WarningSeverity): {
  color: ColorTokens
  backgroundColor: ColorTokens
  textColor: ColorTokens
} {
  switch (severity) {
    case WarningSeverity.High:
      return {
        color: '$statusCritical',
        backgroundColor: '$DEP_accentCriticalSoft',
        textColor: '$statusCritical',
      }
    case WarningSeverity.Medium:
      return {
        color: '$DEP_accentWarning',
        backgroundColor: '$DEP_accentWarningSoft',
        textColor: '$DEP_accentWarning',
      }
    case WarningSeverity.Blocked:
    case WarningSeverity.Low:
    case WarningSeverity.None:
    default:
      return {
        color: '$neutral2',
        backgroundColor: '$surface3',
        textColor: '$neutral1',
      }
  }
}

export function getWarningButtonProps(severity?: WarningSeverity): { theme: ThemeNames; buttonTextColor: ColorTokens } {
  switch (severity) {
    case WarningSeverity.High:
      return {
        buttonTextColor: '$statusCritical',
        theme: 'detrimental',
      }
    case WarningSeverity.Medium:
    case WarningSeverity.Blocked:
    case WarningSeverity.Low:
    case WarningSeverity.None:
    default:
      return {
        buttonTextColor: '$neutral1',
        theme: 'secondary',
      }
  }
}

export function getWarningIconColorOverride(severity?: WarningSeverity): ColorTokens | undefined {
  switch (severity) {
    case WarningSeverity.High:
      return '$statusCritical'
    case WarningSeverity.Medium:
    case WarningSeverity.Blocked:
      return '$neutral2'
    case WarningSeverity.Low:
    case WarningSeverity.None:
    default:
      return undefined
  }
}
