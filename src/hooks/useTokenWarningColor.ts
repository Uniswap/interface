import { SAFETY_WARNING } from 'constants/tokenWarnings'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components/macro'

export const useTokenWarningColor = (level: SAFETY_WARNING) => {
  const [color, setColor] = useState('')
  const theme = useTheme()

  useEffect(() => {
    switch (level) {
      case SAFETY_WARNING.MEDIUM:
        return setColor(theme.accentWarning)
      case SAFETY_WARNING.UNKNOWN:
        return setColor(theme.accentFailure)
      case SAFETY_WARNING.BLOCKED:
        return setColor(theme.textSecondary)
    }
  }, [level, theme])

  return color
}
