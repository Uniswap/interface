import { TFunction } from 'i18next'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'

export function getTokenSafetyHeaderText(
  safetyLevel: NullUndefined<SafetyLevel>,
  t: TFunction
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
