import { InterfaceEventName } from '@uniswap/analytics-events'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, useTrace } from 'analytics'
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
  const analyticsContext = useTrace()
  const [searchParams, setSearchParams] = useSearchParams()

  return useCallback(
    async (targetChain: ChainId) => {
      if (!connector) return

      sendAnalyticsEvent(InterfaceEventName.SELECT_CHAIN_INITIATED, {
        wallet_type: getConnection(connector).getName(),
        chain_id: targetChain,
        ...analyticsContext,
      })

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
    [analyticsContext, connector, dispatch, searchParams, setSearchParams, switchChain]
  )
}
