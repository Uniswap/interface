import { useMemo } from 'react'
import {
  TokenTransfer,
  TransactionDetails,
  TransactionType,
  useRecentTokenTransfersQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function useRecentTokenTransfers(address?: string) {
  const { data, loading } = useRecentTokenTransfersQuery({
    variables: { address: address ?? '' },
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
          (activity.details as TransactionDetails).assetChanges[0]?.__typename === 'TokenTransfer'
      )
      // Safe to unwrap based on filter expression above
      .map((activity) => ((activity!.details as TransactionDetails).assetChanges as TokenTransfer[])[0])

    return {
      data: recentTransactions.length > 0 ? recentTransactions : undefined,
      loading: false,
    }
  }, [data, loading])
}
