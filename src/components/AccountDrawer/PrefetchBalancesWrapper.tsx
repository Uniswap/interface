import { useWeb3React } from '@web3-react/core'
import { usePortfolioBalancesLazyQuery } from 'graphql/data/__generated__/types-and-hooks'
import usePrevious from 'hooks/usePrevious'
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import { useAllTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/types'

import { useAccountDrawer } from '.'

const isTxPending = (tx: TransactionDetails) => !tx.receipt
function wasPending(previousTxs: { [hash: string]: TransactionDetails | undefined }, current: TransactionDetails) {
  const previousTx = previousTxs[current.hash]
  return previousTx && isTxPending(previousTx)
}

function useHasUpdatedTx() {
  // TODO: consider monitoring tx's on chains other than the wallet's current chain
  const currentChainTxs = useAllTransactions()

  const pendingTxs = useMemo(() => {
    return Object.entries(currentChainTxs).reduce((acc: { [hash: string]: TransactionDetails }, [hash, tx]) => {
      if (!tx.receipt) acc[hash] = tx
      return acc
    }, {})
  }, [currentChainTxs])

  const previousPendingTxs = usePrevious(pendingTxs)

  return useMemo(() => {
    if (!previousPendingTxs) return false
    return Object.values(currentChainTxs).some(
      (tx) => !isTxPending(tx) && wasPending(previousPendingTxs, tx),
      [currentChainTxs, previousPendingTxs]
    )
  }, [currentChainTxs, previousPendingTxs])
}

/* Prefetches & caches portfolio balances when the wrapped component is hovered or the user completes a transaction */
export default function PrefetchBalancesWrapper({ children }: PropsWithChildren) {
  const { account } = useWeb3React()
  const [prefetchPortfolioBalances] = usePortfolioBalancesLazyQuery()
  const [drawerOpen] = useAccountDrawer()

  const [hasUnfetchedBalances, setHasUnfetchedBalances] = useState(true)
  const fetchBalances = useCallback(() => {
    if (account) {
      prefetchPortfolioBalances({ variables: { ownerAddress: account } })
      setHasUnfetchedBalances(false)
    }
  }, [account, prefetchPortfolioBalances])

  // TODO(cartcrom): add delay for refetching on optimism, as there is high latency in new balances being available
  const hasUpdatedTx = useHasUpdatedTx()
  // Listens for recently updated transactions to keep portfolio balances fresh in apollo cache
  useEffect(() => {
    if (!hasUpdatedTx) return

    // If the drawer is open, fetch balances immediately, else set a flag to fetch on next hover
    if (drawerOpen) fetchBalances()
    else setHasUnfetchedBalances(true)
  }, [drawerOpen, fetchBalances, hasUpdatedTx])

  const onHover = useCallback(() => {
    if (hasUnfetchedBalances) fetchBalances()
  }, [fetchBalances, hasUnfetchedBalances])

  return <div onMouseEnter={onHover}>{children}</div>
}
