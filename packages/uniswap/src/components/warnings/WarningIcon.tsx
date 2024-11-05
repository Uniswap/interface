import { ColorTokens, Flex, IconProps } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import {
  getWarningIcon,
  getWarningIconColors,
  safetyLevelToWarningSeverity,
} from 'uniswap/src/components/warnings/utils'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

interface Props {
  // TODO (WALL-4626): remove SafetyLevel entirely
  safetyLevel?: Maybe<SafetyLevel>
  severity?: WarningSeverity
  // To override the normally associated safetyLevel<->color mapping
  strokeColorOverride?: ColorTokens
  heroIcon?: boolean
}

export default function WarningIcon({
  safetyLevel,
  severity,
  strokeColorOverride,
  heroIcon,
  ...rest
}: Props & IconProps): JSX.Element | null {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)
  const severityToUse = severity ?? safetyLevelToWarningSeverity(safetyLevel)
  const { color: defaultIconColor, backgroundColor } = getWarningIconColors(severityToUse)
  const color = strokeColorOverride ?? defaultIconColor
  const Icon = getWarningIcon(severityToUse, tokenProtectionEnabled)
  const icon = <Icon color={color} {...rest} />
  return heroIcon ? (
    <Flex borderRadius="$rounded12" p="$spacing12" backgroundColor={backgroundColor}>
      {icon}
    </Flex>
  ) : (
    icon
  )
}
