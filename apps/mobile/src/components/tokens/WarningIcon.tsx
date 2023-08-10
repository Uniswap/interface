import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { useTokenSafetyLevelColors } from 'src/features/tokens/safetyHooks'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import XOctagon from 'ui/src/assets/icons/x-octagon.svg'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'

interface Props {
  safetyLevel: Maybe<SafetyLevel>
  // To override the normally associated safetyLevel<->color mapping
  strokeColorOverride?: 'DEP_accentWarning' | 'statusCritical' | 'neutral3'
}

export default function WarningIcon({
  safetyLevel,
  strokeColorOverride,
  ...rest
}: Props & SvgProps): JSX.Element | null {
  const theme = useAppTheme()

  const colorKey = useTokenSafetyLevelColors(safetyLevel)
  const color = theme.colors[strokeColorOverride ?? colorKey]

  if (safetyLevel === SafetyLevel.Blocked) {
    return <XOctagon color={color} {...rest} />
  }
  return <AlertTriangle color={color} {...rest} />
}
