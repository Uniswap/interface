import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import XOctagon from 'src/assets/icons/x-octagon.svg'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'
import { useTokenSafetyLevelColors } from 'src/features/tokens/useTokenWarningLevel'

interface Props {
  safetyLevel: NullUndefined<SafetyLevel>
}

export default function WarningIcon({ safetyLevel, ...rest }: Props & SvgProps) {
  const colorKey = useTokenSafetyLevelColors(safetyLevel)
  const theme = useAppTheme()
  if (safetyLevel === SafetyLevel.MediumWarning || safetyLevel === SafetyLevel.StrongWarning) {
    return <AlertTriangle color={theme.colors[colorKey]} {...rest} />
  }
  if (safetyLevel === SafetyLevel.Blocked) {
    return <XOctagon color={theme.colors[colorKey]} {...rest} />
  }
  return null
}
