import { ColorTokens, Flex, IconProps } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import {
  getWarningIcon,
  getWarningIconColors,
  safetyLevelToWarningSeverity,
} from 'uniswap/src/components/warnings/utils'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

interface Props {
  // TODO (WALL-4626): remove SafetyLevel entirely
  /** @deprecated use severity instead */
  safetyLevel?: Maybe<SafetyLevel>
  severity?: WarningSeverity
  // To override the normally associated safetyLevel<->color mapping
  strokeColorOverride?: ColorTokens
  heroIcon?: boolean
  inModal?: boolean
}

export default function WarningIcon({
  safetyLevel,
  severity,
  strokeColorOverride,
  heroIcon,
  inModal,
  ...rest
}: Props & IconProps): JSX.Element | null {
  const severityToUse = severity ?? safetyLevelToWarningSeverity(safetyLevel)
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
