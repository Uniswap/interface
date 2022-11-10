import { ChainId } from '@kyberswap/ks-sdk-core'
import useSWR from 'swr'

import { KS_SETTING_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'

const useLiquiditySources = (chainId?: ChainId) => {
  const chainString = chainId ? NETWORKS_INFO[chainId].internalRoute : ''

  return useSWR<{ name: string; logoURL: string; dexId: string }[]>(
    `${KS_SETTING_API}/v1/dexes?chain=${chainString}&isEnabled=true&pageSize=100`,
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
