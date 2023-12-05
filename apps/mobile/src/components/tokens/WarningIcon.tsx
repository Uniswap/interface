import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useTokenSafetyLevelColors } from 'src/features/tokens/safetyHooks'
import { useSporeColors } from 'ui/src'
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
  const colors = useSporeColors()
  const colorKey = useTokenSafetyLevelColors(safetyLevel)
  const color = colors[strokeColorOverride ?? colorKey].val

  if (safetyLevel === SafetyLevel.Blocked) {
    return <XOctagon color={color} {...rest} />
  }
  return <AlertTriangle color={color} {...rest} />
}
