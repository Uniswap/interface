import { WARNING_LEVEL } from 'constants/tokenSafety'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components/macro'

export const useTokenWarningColor = (level: WARNING_LEVEL) => {
  const [color, setColor] = useState('')
  const theme = useTheme()

  useEffect(() => {
    switch (level) {
      case WARNING_LEVEL.MEDIUM:
        return setColor(theme.accentWarning)
      case WARNING_LEVEL.UNKNOWN:
        return setColor(theme.accentFailure)
      case WARNING_LEVEL.BLOCKED:
        return setColor(theme.textSecondary)
    }
  }, [level, theme])

  return color
}
