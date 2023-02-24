import { useWeb3React } from '@web3-react/core'
import { usePortfolioBalancesLazyQuery } from 'graphql/data/__generated__/types-and-hooks'
import { PropsWithChildren, useCallback, useState } from 'react'

/* Prefetches & caches portfolio balances when the wrapped component is hovered */
export default function PrefetchBalancesWrapper({ children }: PropsWithChildren) {
  const { account } = useWeb3React()
  const [hasPrefetched, setHasPrefetched] = useState(false)
  const [prefetchPortfolioBalances] = usePortfolioBalancesLazyQuery()
  const onHover = useCallback(() => {
    if (!hasPrefetched && account) {
      prefetchPortfolioBalances({ variables: { ownerAddress: account } })
      setHasPrefetched(true)
    }
  }, [account, hasPrefetched, prefetchPortfolioBalances])

  return <div onMouseEnter={onHover}>{children}</div>
}
