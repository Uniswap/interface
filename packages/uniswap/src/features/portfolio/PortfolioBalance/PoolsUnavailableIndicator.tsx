import { isWebPlatform } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import type { IconSizeTokens } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const TOOLTIP_MAX_WIDTH = 280

interface PoolsUnavailableIndicatorProps {
  message?: string
  iconSize?: IconSizeTokens
}

export function PoolsUnavailableIndicator({
  message,
  iconSize = '$icon.20',
}: PoolsUnavailableIndicatorProps = {}): JSX.Element {
  const { t } = useTranslation()

  const icon = (
    <Flex testID={TestID.PoolsUnavailableIndicator}>
      <AlertTriangleFilled color="$neutral2" size={iconSize} />
    </Flex>
  )

  if (!isWebPlatform) {
    return icon
  }

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger>{icon}</Tooltip.Trigger>
      <Tooltip.Content maxWidth={TOOLTIP_MAX_WIDTH}>
        <Flex row>
          <Text variant="body4" color="$neutral1" flexShrink={1}>
            {message ?? t('pool.balances.unavailable')}
          </Text>
        </Flex>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
