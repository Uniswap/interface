import {
  TokenTransfer,
  TransactionDetails,
  TransactionType,
  useRecentTokenTransfersQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { useMemo } from 'react'

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
          (activity.details as TransactionDetails).type === TransactionType.Send &&
          (activity.details as TransactionDetails).assetChanges.length === 1 &&
          (activity.details as TransactionDetails).assetChanges[0].__typename === 'TokenTransfer'
      )
      .map((activity) => ((activity.details as TransactionDetails).assetChanges as TokenTransfer[])[0])

    return {
      data: recentTransactions.length > 0 ? recentTransactions : undefined,
      loading: false,
    }
  }, [data, loading])
}
