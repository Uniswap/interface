import { useWeb3React } from '@web3-react/core'
import { useGetConnection } from 'connection'
import { SupportedChainId } from 'constants/chains'
import { useCallback } from 'react'
import { addPopup } from 'state/application/reducer'
import { updateConnectionError } from 'state/connection/reducer'
import { useAppDispatch } from 'state/hooks'
import { switchChain } from 'utils/switchChain'

export default function useSelectChain() {
  const dispatch = useAppDispatch()
  const { connector } = useWeb3React()
  const getConnection = useGetConnection()

  return useCallback(
    async (targetChain: SupportedChainId) => {
      if (!connector) return

      const connectionType = getConnection(connector).type

      try {
        dispatch(updateConnectionError({ connectionType, error: undefined }))
        await switchChain(connector, targetChain)
      } catch (error) {
        console.error('Failed to switch networks', error)

        dispatch(updateConnectionError({ connectionType, error: error.message }))
        dispatch(addPopup({ content: { failedSwitchNetwork: targetChain }, key: 'failed-network-switch' }))
      }
    },
    [connector, dispatch, getConnection]
  )
}
