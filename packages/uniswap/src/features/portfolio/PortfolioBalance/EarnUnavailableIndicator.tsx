import { isWebPlatform } from '@universe/environment'
import { Flex, Text } from '@universe/mycelium'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'

export function EarnUnavailableIndicator(): JSX.Element {
  const { t } = useTranslation()

  const icon = (
    <Flex testID={TestID.EarnUnavailableIndicator}>
      <AlertTriangleFilled color="$neutral2" size="$icon.20" />
    </Flex>
  )

  if (!isWebPlatform) {
    return icon
  }

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger>{icon}</Tooltip.Trigger>
      <Tooltip.Content>
        <Text variant="body4" color="$neutral1">
          {t('explore.earn.balances.unavailable')}
        </Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
