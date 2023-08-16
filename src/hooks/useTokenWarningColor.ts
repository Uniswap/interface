import { WARNING_LEVEL } from 'constants/tokenSafety'
import { useTheme } from 'styled-components'

export const useTokenWarningTextColor = (level: WARNING_LEVEL) => {
  const theme = useTheme()

  switch (level) {
    case WARNING_LEVEL.MEDIUM:
      return theme.deprecated_accentWarning
    case WARNING_LEVEL.UNKNOWN:
      return theme.critical
    case WARNING_LEVEL.BLOCKED:
      return theme.neutral2
  }
}

export const useTokenWarningColor = (level: WARNING_LEVEL) => {
  const theme = useTheme()

  switch (level) {
    case WARNING_LEVEL.MEDIUM:
    case WARNING_LEVEL.BLOCKED:
      return theme.surface3
    case WARNING_LEVEL.UNKNOWN:
      return theme.deprecated_accentFailureSoft
  }
}
