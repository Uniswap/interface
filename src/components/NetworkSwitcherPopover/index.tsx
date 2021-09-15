import React, { ReactNode, useEffect } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
import { useActiveWeb3React } from '../../hooks'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals } from '../../state/application/hooks'
import { NetworkSwitcher, NetworkOptionProps, networkOptionsPreset } from '../NetworkSwitcher'
interface NetworkSwitcherPopoverProps {
  children: ReactNode
  modal: ApplicationModal
  placement?: Placement
}

export default function NetworkSwitcherPopover({ children, modal, placement }: NetworkSwitcherPopoverProps) {
  const closeModals = useCloseModals()
  const { connector, chainId } = useActiveWeb3React()
  const networkSwitcherPopoverOpen = useModalOpen(modal)

  const { selectEthereum, selectNetwork } = useNetworkSwitch({
    onSelectNetworkCallback: closeModals
  })

  useEffect(() => {
    if (chainId === ChainId.MAINNET) {
      closeModals()
    }
  }, [chainId, closeModals])

  const isOptionDisabled = (networkId: ChainId) => {
    return connector?.supportedChainIds?.indexOf(networkId) === -1 || chainId === networkId
  }

  const options = networkOptionsPreset.map<NetworkOptionProps>(network => {
    const { chainId, logoSrc, name } = network

    return {
      logoSrc,
      header: name,
      disabled: isOptionDisabled(chainId),
      onClick: chainId === ChainId.MAINNET ? selectEthereum : () => selectNetwork(chainId)
    }
  })

  return (
    <NetworkSwitcher
      options={options}
      show={networkSwitcherPopoverOpen}
      onOuterClick={closeModals}
      placement={placement}
    >
      {children}
    </NetworkSwitcher>
  )
}
