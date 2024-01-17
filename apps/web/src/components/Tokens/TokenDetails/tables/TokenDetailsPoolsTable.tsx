import { Trans } from '@lingui/macro'
import { ChainId, Token } from '@uniswap/sdk-core'
import { PoolsTable, PoolTableColumns } from 'components/Pools/PoolTable/PoolTable'
import { usePoolsFromTokenAddress } from 'graphql/thegraph/PoolsFromTokenAddress'
import { ThemedText } from 'theme/components'

const HIDDEN_COLUMNS = [PoolTableColumns.Transactions]

export function TokenDetailsPoolsTable({ chainId, referenceToken }: { chainId: ChainId; referenceToken: Token }) {
  const { pools, loading, error, loadMore } = usePoolsFromTokenAddress(referenceToken.address, chainId)

  if (error) {
    return (
      <ThemedText.BodyPrimary>
        <Trans>Error loading Top Pools</Trans>
      </ThemedText.BodyPrimary>
    )
  }

  return (
    <div data-testid={`tdp-pools-table-${referenceToken.address.toLowerCase()}`}>
      <PoolsTable
        pools={pools}
        loading={loading}
        chainId={chainId}
        maxHeight={600}
        hiddenColumns={HIDDEN_COLUMNS}
        loadMore={loadMore}
      />
    </div>
  )
}
