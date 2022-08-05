import { ChainId } from '@kyberswap/ks-sdk-core'
import useSWR from 'swr'

import { NETWORKS_INFO } from 'constants/networks'

type Response = {
  pools: Record<
    string,
    {
      poolSize: number
      tvl: number
      tokenSize: number
    }
  >
}

// It's recommended to use NETWORKS_INFO[chainId].route,
// but very unfortunately that BE uses `bsc` instead of `bnb`
const chainIdMapping: Partial<Record<ChainId, string>> = {
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.BTTC]: 'bttc',
}

const useAggregatorStats = (chainId?: ChainId) => {
  const chainString = chainId ? chainIdMapping[chainId] || NETWORKS_INFO[chainId].route : ''

  return useSWR<Response>(`${process.env.REACT_APP_AGGREGATOR_API}/${chainString}/stats`, async (url: string) => {
    if (!chainId || !chainString) {
      const err = `chain (${chainId}) is not supported`
      console.error(err)
      throw err
    }

    const response = await fetch(url, {
      headers: {
        // need this to get it work in Optimism, it must be capital L
        'Accept-Version': 'Latest',
      },
    })
    if (response.ok) {
      const data = await response.json()
      if (data && data.pools) {
        return data
      }

      const err = `no pools found on ${chainString}`
      console.error(err)
      throw err
    }

    const err = `fetching stats on ${chainString} failed`
    console.error(err)
    throw err
  })
}

export default useAggregatorStats
