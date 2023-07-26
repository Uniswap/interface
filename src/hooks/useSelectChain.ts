import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection'
import { didUserReject } from 'connection/utils'
import { CHAIN_IDS_TO_NAMES, isSupportedChain } from 'constants/chains'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addPopup, PopupType } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

import { useSwitchChain } from './useSwitchChain'

export default function useSelectChain() {
  const dispatch = useAppDispatch()
  const { connector } = useWeb3React()
  const switchChain = useSwitchChain()
  const [searchParams, setSearchParams] = useSearchParams()

  return useCallback(
    async (targetChain: ChainId) => {
      if (!connector) return

      const connection = getConnection(connector)

      try {
        await switchChain(connector, targetChain)
        if (isSupportedChain(targetChain)) {
          searchParams.set('chain', CHAIN_IDS_TO_NAMES[targetChain])
          setSearchParams(searchParams)
        }
      } catch (error) {
        if (!didUserReject(connection, error) && error.code !== -32002 /* request already pending */) {
          console.error('Failed to switch networks', error)
          dispatch(
            addPopup({
              content: { failedSwitchNetwork: targetChain, type: PopupType.FailedSwitchNetwork },
              key: 'failed-network-switch',
            })
          )
        }
      }
    },
    [connector, dispatch, searchParams, setSearchParams, switchChain]
  )
}
