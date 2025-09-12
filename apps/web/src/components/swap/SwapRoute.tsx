import Column from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import RouterLabel from 'components/RouterLabel'
import { UniswapXDescription } from 'components/swap/GasBreakdownTooltip'
import { Trans } from 'react-i18next'
import { SubmittableTrade } from 'state/routing/types'
import { ThemedText } from 'theme/components'
import { Separator } from 'ui/src'

function RouteLabel({ trade }: { trade: SubmittableTrade }) {
  return (
    <RowBetween>
      <ThemedText.BodySmall color="neutral2">
        <Trans i18nKey="swap.orderRouting" />
      </ThemedText.BodySmall>
      <RouterLabel trade={trade} color="neutral1" />
    </RowBetween>
  )
}

export function RoutingTooltip({ trade }: { trade: SubmittableTrade }) {
  return (
    <Column gap="md">
      <RouteLabel trade={trade} />
      <Separator />
      <UniswapXDescription />
    </Column>
  )
}
