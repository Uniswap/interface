import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { ThemedText } from 'theme/components'

import { PoolDetailsTableSkeleton } from './PoolDetailsTableSkeleton'
import { PoolDetailsTransactionsTable } from './PoolDetailsTransactionsTable'

export function PoolDetailsTable({ loading }: { loading: boolean }) {
  return loading ? (
    <PoolDetailsTableSkeleton />
  ) : (
    <Column gap="lg">
      <Row gap="16px">
        <ThemedText.HeadlineMedium>
          <Trans>Transactions</Trans>
        </ThemedText.HeadlineMedium>
        {/* TODO(WEB-2855): Add working positions table */}
        <ThemedText.HeadlineMedium color="neutral2">
          <Trans>Positions</Trans>
        </ThemedText.HeadlineMedium>
      </Row>
      <PoolDetailsTransactionsTable />
    </Column>
  )
}
