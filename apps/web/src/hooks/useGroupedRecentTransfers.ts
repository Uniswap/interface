import { useRecentTokenTransfers } from 'appGraphql/data/RecentTokenTransfers'
import { useMemo } from 'react'

export function useGroupedRecentTransfers(account?: string) {
  const { data: recentTransfers, loading } = useRecentTokenTransfers(account)

  return useMemo(
    () => ({
      transfers: recentTransfers?.reduce(
        (acc, transfer) => {
          const address = transfer.recipient
          if (acc[address]) {
            acc[address]++
          } else {
            acc[address] = 1
          }
          return acc
        },
        {} as { [address: string]: number },
      ),
      loading,
    }),

    [loading, recentTransfers],
  )
}
