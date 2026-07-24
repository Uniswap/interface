import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text } from 'ui/src'
import { UniswapXDescription } from '~/pages/Swap/Limit/GasBreakdownTooltip'
import { RouterLabel } from '~/pages/Swap/Limit/RouterLabel/RouterLabel'
import { SubmittableTrade } from '~/state/routing/types'

function RouteLabel({ trade }: { trade: SubmittableTrade }) {
  const { t } = useTranslation()
  return (
    <Flex row width="100%" justifyContent="space-between" alignItems="center">
      <Text variant="body3" color="$neutral2">
        {t('common.bestRoute')}
      </Text>
      <RouterLabel trade={trade} color="$neutral1" />
    </Flex>
  )
}

export function RoutingTooltip({ trade }: { trade: SubmittableTrade }) {
  return (
    <Flex gap="$gap12">
      <RouteLabel trade={trade} />
      <Separator />
      <UniswapXDescription />
    </Flex>
  )
}
