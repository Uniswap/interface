import { useTheme } from 'styled-components'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export const useTokenWarningTextColor = (level: SafetyLevel) => {
  const theme = useTheme()

  switch (level) {
    case SafetyLevel.MediumWarning:
      return theme.deprecated_accentWarning
    case SafetyLevel.StrongWarning:
      return theme.critical
    case SafetyLevel.Blocked:
      return theme.neutral2
    default:
      return 'inherit'
  }
}

export const useTokenWarningColor = (level: SafetyLevel) => {
  const theme = useTheme()

  switch (level) {
    case SafetyLevel.MediumWarning:
    case SafetyLevel.Blocked:
      return theme.surface3
    case SafetyLevel.StrongWarning:
      return theme.deprecated_accentFailureSoft
    default:
      return 'inherit'
  }
}
