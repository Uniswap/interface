import { AppTFunction } from 'ui/src/i18n/types'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function getTokenSafetyHeaderText(
  safetyLevel: Maybe<SafetyLevel>,
  t: AppTFunction
): string | undefined {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return t('token.safetyLevel.medium.header')
    case SafetyLevel.StrongWarning:
      return t('token.safetyLevel.strong.header')
    case SafetyLevel.Blocked:
      return t('token.safetyLevel.blocked.header')
  }
}
