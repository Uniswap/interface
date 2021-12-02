import React, { ReactNode, useEffect } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
import { useActiveWeb3React } from '../../hooks'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals } from '../../state/application/hooks'
import { NetworkSwitcher, networkOptionsPreset } from '../NetworkSwitcher'
import { createNetworksList } from '../../utils/networksList'

interface NetworkSwitcherPopoverProps {
  children: ReactNode
  modal: ApplicationModal
  placement?: Placement
}

export default function NetworkSwitcherPopover({ children, modal, placement }: NetworkSwitcherPopoverProps) {
  const closeModals = useCloseModals()
  const { connector, chainId: activeChainId, account } = useActiveWeb3React()
  const networkSwitcherPopoverOpen = useModalOpen(modal)

  const { selectEthereum, selectNetwork } = useNetworkSwitch({
    onSelectNetworkCallback: closeModals
  })

  useEffect(() => {
    if (activeChainId === ChainId.MAINNET) {
      closeModals()
    }
  }, [activeChainId, closeModals])

  const isNetworkDisabled = (networkId: ChainId) => {
    return connector?.supportedChainIds?.indexOf(networkId) === -1 || activeChainId === networkId
  }

  function onNetworkChange(chainId: ChainId) {
    return chainId === ChainId.MAINNET ? selectEthereum() : selectNetwork(chainId)
  }

  const selectorNetworkList = createNetworksList({
    networkOptionsPreset: networkOptionsPreset,
    selectedNetworkChainId: activeChainId ? activeChainId : -1,
    onNetworkChange,
    activeChainId: !!account ? activeChainId : -1,
    isNetworkDisabled,
    removeSpecifiedTag: 'coming soon'
  })

  return (
    <NetworkSwitcher
      networksList={selectorNetworkList}
      show={networkSwitcherPopoverOpen}
      onOuterClick={closeModals}
      placement={placement}
    >
      {children}
    </NetworkSwitcher>
  )
}
