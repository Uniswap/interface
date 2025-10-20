import { GraphQLApi } from '@universe/api'
import { ColorTokens, GeneratedIcon } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Blocked } from 'ui/src/components/icons/Blocked'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { OctagonExclamation } from 'ui/src/components/icons/OctagonExclamation'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

export function safetyLevelToWarningSeverity(safetyLevel: Maybe<GraphQLApi.SafetyLevel>): WarningSeverity {
  switch (safetyLevel) {
    case GraphQLApi.SafetyLevel.Blocked:
      return WarningSeverity.Blocked
    case GraphQLApi.SafetyLevel.Verified:
      return WarningSeverity.None
    case GraphQLApi.SafetyLevel.StrongWarning:
      return WarningSeverity.High
    case GraphQLApi.SafetyLevel.MediumWarning:
    default:
      return WarningSeverity.Medium
  }
}

export function getWarningIcon(severity: WarningSeverity): GeneratedIcon | null {
  switch (severity) {
    case WarningSeverity.High:
      return OctagonExclamation
    case WarningSeverity.Medium:
      return AlertTriangleFilled
    case WarningSeverity.Blocked:
      return Blocked
    case WarningSeverity.Low:
      return InfoCircleFilled
    case WarningSeverity.None:
    default:
      return null
  }
}

export function getWarningIconColors(severity?: WarningSeverity): {
  color: ColorTokens
  /** `colorSecondary` used instead of `color` in certain places, such as token selector & mobile search */
  colorSecondary?: ColorTokens
  /** `inModalColor` used instead of `color` when the icon is inside a modal */
  inModalColor?: ColorTokens
  backgroundColor: ColorTokens
  textColor: ColorTokens
} {
  switch (severity) {
    case WarningSeverity.High:
      return {
        color: '$statusCritical',
        colorSecondary: '$statusCritical',
        backgroundColor: '$statusCritical2',
        textColor: '$statusCritical',
      }
    case WarningSeverity.Medium:
      return {
        color: '$statusWarning',
        colorSecondary: '$neutral2',
        backgroundColor: '$statusWarning2',
        textColor: '$statusWarning',
      }
    case WarningSeverity.Blocked:
      return {
        color: '$neutral2',
        colorSecondary: '$neutral2',
        inModalColor: '$neutral1',
        backgroundColor: '$surface3',
        textColor: '$neutral1',
      }
    case WarningSeverity.Low:
    case WarningSeverity.None:
    default:
      return {
        color: '$neutral2',
        colorSecondary: undefined,
        inModalColor: '$neutral1',
        backgroundColor: '$surface3',
        textColor: '$neutral1',
      }
  }
}
