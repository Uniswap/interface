import { IconProps, useSporeColors } from 'ui/src'
import { AlertTriangle, XOctagon } from 'ui/src/components/icons'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useTokenSafetyLevelColors } from 'wallet/src/features/tokens/safetyHooks'

interface Props {
  safetyLevel: Maybe<SafetyLevel>
  // To override the normally associated safetyLevel<->color mapping
  strokeColorOverride?: 'DEP_accentWarning' | 'statusCritical' | 'neutral3'
}

export default function WarningIcon({
  safetyLevel,
  strokeColorOverride,
  ...rest
}: Props & IconProps): JSX.Element | null {
  const colors = useSporeColors()
  const colorKey = useTokenSafetyLevelColors(safetyLevel)
  const color = colors[strokeColorOverride ?? colorKey].val

  if (safetyLevel === SafetyLevel.Blocked) {
    return <XOctagon color={color} {...rest} />
  }
  return <AlertTriangle color={color} {...rest} />
}
