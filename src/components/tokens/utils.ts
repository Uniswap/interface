import { TFunction } from 'i18next'
import { SafetyLevel } from 'src/features/dataApi/types'

export function getTokenSafetyHeaderText(safetyLevel: NullUndefined<SafetyLevel>, t: TFunction) {
  switch (safetyLevel) {
    case SafetyLevel.Medium:
      return t('Caution')
    case SafetyLevel.Strong:
      return t('Warning')
    case SafetyLevel.Blocked:
      return t('Not available')
  }
}
