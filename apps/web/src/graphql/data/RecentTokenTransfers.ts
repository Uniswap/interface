import { useMemo } from 'react'
import {
  TokenTransfer,
  TransactionDetails,
  TransactionType,
  useRecentTokenTransfersQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

export function useRecentTokenTransfers(address?: string) {
  const { gqlChains } = useEnabledChains()
  const { data, loading } = useRecentTokenTransfersQuery({
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
          (activity.details as TransactionDetails).type === TransactionType.Send &&
          (activity.details as TransactionDetails).assetChanges.length === 1 &&
          (activity.details as TransactionDetails).assetChanges[0]?.__typename === 'TokenTransfer' &&
          ((activity.details as TransactionDetails).assetChanges as TokenTransfer[])[0].asset.project &&
          !((activity.details as TransactionDetails).assetChanges as TokenTransfer[])[0].asset.project?.isSpam,
      )
      // Safe to unwrap based on filter expression above
      .map((activity) => ((activity!.details as TransactionDetails).assetChanges as TokenTransfer[])[0])

    return {
      data: recentTransactions.length > 0 ? recentTransactions : undefined,
      loading: false,
    }
  }, [data, loading])
}
