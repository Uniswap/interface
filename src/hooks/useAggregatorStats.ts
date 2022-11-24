import { ChainId } from '@kyberswap/ks-sdk-core'
import useSWR from 'swr'

import { KS_SETTING_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'

const useLiquiditySources = (chainId: ChainId) => {
  return useSWR<{ name: string; logoURL: string; dexId: string }[]>(
    `${KS_SETTING_API}/v1/dexes?chain=${NETWORKS_INFO[chainId].ksSettingRoute}&isEnabled=true&pageSize=100`,
    async (url: string) => {
      if (!NETWORKS_INFO[chainId].ksSettingRoute) return

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data && data.data.dexes) {
          return data.data.dexes
        }

        const err = `no pools found on ${NETWORKS_INFO[chainId].name}`
        console.error(err)
        throw err
      }

      const err = `fetching stats on ${NETWORKS_INFO[chainId].name} failed`
      console.error(err)
      throw err
    },
  )
}

export default useLiquiditySources
