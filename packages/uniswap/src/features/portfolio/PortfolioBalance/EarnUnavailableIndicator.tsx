import { isWebPlatform } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
