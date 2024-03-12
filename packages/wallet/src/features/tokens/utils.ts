import { AppTFunction } from 'ui/src/i18n/types'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'

export function getTokenSafetyHeaderText(
  safetyLevel: Maybe<SafetyLevel>,
  t: AppTFunction
): string | undefined {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return t('Caution')
    case SafetyLevel.StrongWarning:
      return t('Warning')
    case SafetyLevel.Blocked:
      return t('Not available')
  }
}
