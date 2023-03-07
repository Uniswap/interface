import { WARNING_LEVEL } from 'constants/tokenSafety'
import { useTheme } from 'styled-components/macro'

export const useTokenWarningTextColor = (level: WARNING_LEVEL) => {
  const theme = useTheme()

  switch (level) {
    case WARNING_LEVEL.MEDIUM:
      return theme.accentWarning
    case WARNING_LEVEL.UNKNOWN:
      return theme.accentFailure
    case WARNING_LEVEL.BLOCKED:
      return theme.textSecondary
  }
}

export const useTokenWarningColor = (level: WARNING_LEVEL) => {
  const theme = useTheme()

  switch (level) {
    case WARNING_LEVEL.MEDIUM:
      return theme.accentWarningSoft
    case WARNING_LEVEL.UNKNOWN:
      return theme.accentFailureSoft
    case WARNING_LEVEL.BLOCKED:
      return theme.backgroundFloating
  }
}
