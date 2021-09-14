import React, { ReactNode, useEffect, useRef } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
import { useActiveWeb3React } from '../../hooks'
import { getObjectKeys } from '../../utils/objectKeysExtended'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals } from '../../state/application/hooks'
import { NetworkSwitcher, networkSwitcherOptionsPreset, NetworkOptionProps } from '../NetworkSwitcher'
interface NetworkSwitcherPopoverProps {
  children: ReactNode
  modal: ApplicationModal
  placement?: Placement
}

export default function NetworkSwitcherPopover({ children, modal, placement }: NetworkSwitcherPopoverProps) {
  const popoverRef = useRef(null)
  const closeModals = useCloseModals()
  const { connector, chainId } = useActiveWeb3React()
  const networkSwitcherPopoverOpen = useModalOpen(modal)
  const ethereumOptionPopoverOpen = useModalOpen(ApplicationModal.ETHEREUM_OPTION)

  useOnClickOutside(popoverRef, () => {
    if (networkSwitcherPopoverOpen || ethereumOptionPopoverOpen) closeModals()
  })

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

  const options = getObjectKeys(networkSwitcherOptionsPreset).map(optionChainId => {
    const chainId = Number(optionChainId)

    return {
      ...(networkSwitcherOptionsPreset[optionChainId] as NetworkOptionProps),
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
