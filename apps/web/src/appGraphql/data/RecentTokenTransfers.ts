import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

export function useRecentTokenTransfers(address?: string) {
  const { gqlChains } = useEnabledChains()
  const { data, loading } = GraphQLApi.useRecentTokenTransfersQuery({
    variables: {
      address: address ?? '',
      chains: gqlChains,
    },
    skip: !address,
  })

  return useMemo(() => {
    if (!data?.portfolios?.[0]?.assetActivities) {
      return {
        data: undefined,
        loading,
      }
    }

    const recentTransactions = data.portfolios[0].assetActivities
      .filter(
        (activity) =>
          activity &&
          (activity.details as GraphQLApi.TransactionDetails).type === GraphQLApi.TransactionType.Send &&
          (activity.details as GraphQLApi.TransactionDetails).assetChanges.length === 1 &&
          (activity.details as GraphQLApi.TransactionDetails).assetChanges[0]?.__typename === 'TokenTransfer' &&
          ((activity.details as GraphQLApi.TransactionDetails).assetChanges as GraphQLApi.TokenTransfer[])[0].asset
            .project &&
          !((activity.details as GraphQLApi.TransactionDetails).assetChanges as GraphQLApi.TokenTransfer[])[0].asset
            .project?.isSpam,
      )
      // Safe to unwrap based on filter expression above
      .map(
        (activity) =>
          ((activity!.details as GraphQLApi.TransactionDetails).assetChanges as GraphQLApi.TokenTransfer[])[0],
      )

    return {
      data: recentTransactions.length > 0 ? recentTransactions : undefined,
      loading: false,
    }
  }, [data, loading])
}
