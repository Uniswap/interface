import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { QueryClient } from '@tanstack/react-query'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isInstantTokenBalanceUpdateEnabled } from 'uniswap/src/features/portfolio/portfolioUpdates/isInstantTokenBalanceUpdateEnabled'
import { refetchGQLQueriesViaBackendPollVariant } from 'uniswap/src/features/portfolio/portfolioUpdates/refetchGQLQueriesViaBackendPollVariantSaga'
import { refetchGQLQueriesViaOnchainOverrideVariant } from 'uniswap/src/features/portfolio/portfolioUpdates/refetchGQLQueriesViaOnchainOverrideVariantSaga'
import { refetchRestQueriesViaOnchainOverrideVariant } from 'uniswap/src/features/portfolio/portfolioUpdates/rest/refetchRestQueriesViaOnchainOverrideVariantSaga'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export function* refetchGQLQueries({
  transaction,
  apolloClient,
  activeAddress,
  queryClient,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
  activeAddress: string | null
  queryClient?: QueryClient
}) {
  if (isInstantTokenBalanceUpdateEnabled()) {
    yield* refetchGQLQueriesViaOnchainOverrideVariant({ transaction, apolloClient, activeAddress, queryClient })
  } else {
    yield* refetchGQLQueriesViaBackendPollVariant({ transaction, apolloClient, activeAddress })
  }
}

export function* refetchQueries({
  transaction,
  apolloClient,
  activeAddress,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
  activeAddress: string | null
}) {
  const isRestEnabled = getFeatureFlag(FeatureFlags.GqlToRestBalances)

  if (isRestEnabled) {
    yield* refetchRestQueriesViaOnchainOverrideVariant({ transaction, apolloClient, activeAddress })
  } else {
    yield* refetchGQLQueries({ transaction, apolloClient, activeAddress })
  }
}
