import { ThemeKeys } from 'ui/src'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function useTokenSafetyLevelColors(safetyLevel: Maybe<SafetyLevel>): ThemeKeys {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return 'DEP_accentWarning'
    case SafetyLevel.StrongWarning:
      return 'statusCritical'
    case SafetyLevel.Blocked:
    default:
      return 'neutral2'
  }
}
