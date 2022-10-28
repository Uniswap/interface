import { TFunction } from 'i18next'
import { TokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'

export function getTokenWarningHeaderText(tokenWarningLevel: TokenWarningLevel, t: TFunction) {
  switch (tokenWarningLevel) {
    case TokenWarningLevel.LOW:
      return t('Caution')
    case TokenWarningLevel.MEDIUM:
      return t('Warning')
    case TokenWarningLevel.BLOCKED:
      return t('Not available')
  }
}
