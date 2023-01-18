import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import XOctagon from 'src/assets/icons/x-octagon.svg'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'
import { useTokenSafetyLevelColors } from 'src/features/tokens/safetyHooks'

interface Props {
  safetyLevel: NullUndefined<SafetyLevel>
  // To override the normally associated safetyLevel<->color mapping
  strokeColorOverride?: 'accentWarning' | 'accentCritical' | 'textSecondary'
}

export default function WarningIcon({
  safetyLevel,
  strokeColorOverride,
  ...rest
}: Props & SvgProps): JSX.Element | null {
  const colorKey = useTokenSafetyLevelColors(safetyLevel)
  const theme = useAppTheme()
  if (safetyLevel === SafetyLevel.MediumWarning || safetyLevel === SafetyLevel.StrongWarning) {
    return <AlertTriangle color={theme.colors[strokeColorOverride ?? colorKey]} {...rest} />
  }
  if (safetyLevel === SafetyLevel.Blocked) {
    return <XOctagon color={theme.colors[strokeColorOverride ?? colorKey]} {...rest} />
  }
  return null
}
