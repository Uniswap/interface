import { useEffect, useMemo, useState } from 'react'

import { RECENT_POOL_TX } from 'apollo/queries/promm'
import { POOL_TRANSACTION_TYPE } from 'components/ProAmm/type'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'

type RecentPoolTxsResult = {
  mints: { id: string }[]
  burns: { id: string }[]
}

const usePoolTransactionsStat = (
  poolAddress: string,
):
  | {
      name: string
      value: number
      percent: number
      type: POOL_TRANSACTION_TYPE
    }[]
  | 0
  | undefined => {
  const { isEVM, networkInfo } = useActiveWeb3React()
  const [data, setData] = useState<RecentPoolTxsResult | null>(null)
  const { elasticClient } = useKyberSwapConfig()

  useEffect(() => {
    const controller = new AbortController()
    if (!isEVM) return
    const fetch = async () => {
      setData(null)
      const data = await elasticClient.query<RecentPoolTxsResult>({
        query: RECENT_POOL_TX(poolAddress?.toLowerCase()),
        fetchPolicy: 'cache-first',
      })
      if (!controller.signal.aborted) {
        setData(data.data)
      }
    }
    fetch()
    return () => controller.abort()
  }, [isEVM, networkInfo, poolAddress, elasticClient])

  const result = useMemo(() => {
    if (!data) return undefined
    const addCount = data.mints.length
    const removeCount = data.burns.length
    const sum = addCount + removeCount
    if (sum === 0) return 0

    return [
      { name: 'Add Liquidity', value: addCount, percent: (addCount / sum) * 100, type: POOL_TRANSACTION_TYPE.ADD },
      {
        name: 'Remove Liquidity',
        value: removeCount,
        percent: (removeCount / sum) * 100,
        type: POOL_TRANSACTION_TYPE.REMOVE,
      },
    ]
  }, [data])
  return result
}

export default usePoolTransactionsStat
