import { useQueryClient } from '@tanstack/react-query'
import { PropsWithChildren, useEffect, useMemo } from 'react'
import { usePrevious } from 'utilities/src/react/hooks'
import { apolloClient } from '~/appGraphql/data/apollo/client'
import { useAccount } from '~/hooks/useAccount'
import { useWatchTransactionsCallback } from '~/state/sagas/transactions/watcherSaga'
import { usePendingTransactions } from '~/state/transactions/hooks'

export function TransactionWatcherProvider({ children }: PropsWithChildren) {
  const account = useAccount()
  const queryClient = useQueryClient()

  const pendingTransactions = usePendingTransactions()
  const prevPendingTransactions = usePrevious(pendingTransactions)
  const pendingDiff = useMemo(
    () => prevPendingTransactions?.filter((tx) => !pendingTransactions.includes(tx)),
    [pendingTransactions, prevPendingTransactions],
  )
  const watchTransactions = useWatchTransactionsCallback()

  useEffect(() => {
    if (!account.address || !account.chainId) {
      return
    }

    if (!pendingDiff?.length) {
      return
    }

    watchTransactions({
      address: account.address,
      chainId: account.chainId,
      pendingDiff,
      apolloClient,
      queryClient,
    })
  }, [pendingDiff, account.address, account.chainId, watchTransactions, queryClient])

  return <>{children}</>
}
