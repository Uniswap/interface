import { useCallback } from 'react'
import { ChainId } from '@swapr/sdk'
import { InjectedConnector } from '@web3-react/injected-connector'

import { useActiveWeb3React } from '.'
import { NETWORK_DETAIL } from '../constants'
import { switchOrAddNetwork } from '../utils'
import { CustomNetworkConnector } from '../connectors/CustomNetworkConnector'

export type UseNetworkSwitchProps = {
  onSelectNetworkCallback?: () => void
}

export const useNetworkSwitch = ({ onSelectNetworkCallback }: UseNetworkSwitchProps = {}) => {
  const { connector, chainId, account } = useActiveWeb3React()

  const selectNetwork = useCallback(
    (optionChainId?: ChainId) => {
      if (optionChainId === undefined || optionChainId === chainId) return
      if (!!!account && connector instanceof CustomNetworkConnector) connector.changeChainId(optionChainId)
      else if (connector instanceof InjectedConnector)
        switchOrAddNetwork(NETWORK_DETAIL[optionChainId], account || undefined)
      if (onSelectNetworkCallback) onSelectNetworkCallback()
    },
    [account, chainId, connector, onSelectNetworkCallback]
  )

  return {
    selectNetwork
  }
}
