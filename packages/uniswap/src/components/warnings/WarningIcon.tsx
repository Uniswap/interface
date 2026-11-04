import { Flex, type ColorTokens } from '@universe/mycelium'
import type { IconProps } from '@universe/mycelium/icons'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getWarningIcon, getWarningIconColors } from 'uniswap/src/components/warnings/utils'

interface Props {
  severity?: WarningSeverity
  // To override the normally associated severity<->color mapping
  strokeColorOverride?: ColorTokens
  heroIcon?: boolean
  inModal?: boolean
}

export default function WarningIcon({
  severity,
  strokeColorOverride,
  heroIcon,
  inModal,
  ...rest
}: Props & IconProps): JSX.Element | null {
  // Medium matches the implicit fallback the removed `safetyLevel` prop fed through
  // safetyLevelToWarningSeverity — severity-less callers still expect a visible icon.
  const severityToUse = severity ?? WarningSeverity.Medium
  const { color: defaultIconColor, backgroundColor, inModalColor } = getWarningIconColors(severityToUse)
  const color = strokeColorOverride ?? defaultIconColor
  const Icon = getWarningIcon(severityToUse)
  const icon = Icon ? <Icon color={inModal && inModalColor ? inModalColor : color} {...rest} /> : null
  return heroIcon ? (
    <Flex borderRadius="$rounded12" p="$spacing12" backgroundColor={backgroundColor}>
      {icon}
    </Flex>
  ) : (
    icon
  )
}
