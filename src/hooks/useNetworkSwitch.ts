import { useCallback } from 'react'
import { ChainId } from '@swapr/sdk'
import { isMobile } from 'react-device-detect'
import { InjectedConnector } from '@web3-react/injected-connector'

import { useActiveWeb3React } from '.'
import { NETWORK_DETAIL } from '../constants'
import { switchOrAddNetwork } from '../utils'
import { CustomNetworkConnector } from '../connectors/CustomNetworkConnector'
import { useEthereumOptionPopoverToggle } from '../state/application/hooks'

export type UseNetworkSwitchProps = {
  onSelectNetworkCallback?: () => void
}

export const useNetworkSwitch = ({ onSelectNetworkCallback }: UseNetworkSwitchProps = {}) => {
  const { connector, chainId, account } = useActiveWeb3React()

  const selectNetwork = useCallback(
    (optionChainId: ChainId) => {
      if (optionChainId === chainId) return
      if (!!!account && connector instanceof CustomNetworkConnector) connector.changeChainId(optionChainId)
      else if (connector instanceof InjectedConnector)
        switchOrAddNetwork(NETWORK_DETAIL[optionChainId], account || undefined)
      if (onSelectNetworkCallback) onSelectNetworkCallback()
    },
    [account, chainId, connector, onSelectNetworkCallback]
  )

  const toggleEthereumOptionPopover = useEthereumOptionPopoverToggle()

  const selectEthereum = () => {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    if (isMobile && isMetamask) {
      if (onSelectNetworkCallback) onSelectNetworkCallback()
      toggleEthereumOptionPopover()
    } else {
      selectNetwork(ChainId.MAINNET)
    }
  }

  return {
    selectNetwork,
    selectEthereum
  }
}
