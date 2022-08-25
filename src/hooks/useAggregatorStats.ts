import { ChainId } from '@kyberswap/ks-sdk-core'
import useSWR from 'swr'

import { NETWORKS_INFO } from 'constants/networks'

// It's recommended to use NETWORKS_INFO[chainId].route,
// but very unfortunately that BE uses `bsc` instead of `bnb`
const chainIdMapping: Partial<Record<ChainId, string>> = {
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.BTTC]: 'bttc',
}

const useLiquiditySources = (chainId?: ChainId) => {
  const chainString = chainId ? chainIdMapping[chainId] || NETWORKS_INFO[chainId].route : ''

  return useSWR<{ name: string; logoURL: string; dexId: string }[]>(
    `${process.env.REACT_APP_KS_SETTING_API}/v1/dexes?chain=${chainString}&isEnabled=true&pageSize=100`,
    async (url: string) => {
      if (!chainId || !chainString) {
        const err = `chain (${chainId}) is not supported`
        console.error(err)
        throw err
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data && data.data.dexes) {
          return data.data.dexes
        }

        const err = `no pools found on ${chainString}`
        console.error(err)
        throw err
      }

      const err = `fetching stats on ${chainString} failed`
      console.error(err)
      throw err
    },
  )
}

export default useLiquiditySources
