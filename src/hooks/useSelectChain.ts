import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection'
import { didUserReject } from 'connection/utils'
import { CHAIN_IDS_TO_NAMES, isSupportedChain } from 'constants/chains'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addPopup } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

import { useSwitchChain } from './useSwitchChain'

export default function useSelectChain() {
  const dispatch = useAppDispatch()
  const { connector } = useWeb3React()
  const switchChain = useSwitchChain()
  const [, setSearchParams] = useSearchParams()

  return useCallback(
    async (targetChain: ChainId) => {
      if (!connector) return

      const connection = getConnection(connector)

      try {
        setSearchParams({ chain: '' })
        await switchChain(connector, targetChain)
        if (isSupportedChain(targetChain)) setSearchParams({ chain: CHAIN_IDS_TO_NAMES[targetChain] })
      } catch (error) {
        if (!didUserReject(connection, error) && error.code !== -32002 /* request already pending */) {
          console.error('Failed to switch networks', error)
          dispatch(addPopup({ content: { failedSwitchNetwork: targetChain }, key: 'failed-network-switch' }))
        }
      }
    },
    [connector, dispatch, setSearchParams, switchChain]
  )
}
