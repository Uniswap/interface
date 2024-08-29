import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

// TODO(WALL-4254): fix type
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTokenSafetyLevelColors(safetyLevel: Maybe<SafetyLevel>) {
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
