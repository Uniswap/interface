import React, { ReactNode } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
import { useActiveWeb3React, useUnsupportedChainIdError } from '../../hooks'
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
  const unsupportedChainIdError = useUnsupportedChainIdError()

  const { selectNetwork } = useNetworkSwitch({
    onSelectNetworkCallback: closeModals
  })

  const isNetworkDisabled = (chainId: ChainId) => {
    return (
      connector?.supportedChainIds?.indexOf(chainId) === -1 || (!unsupportedChainIdError && activeChainId === chainId)
    )
  }

  const networkList = createNetworksList({
    networkOptionsPreset,
    onNetworkChange: selectNetwork,
    isNetworkDisabled,
    selectedNetworkChainId: activeChainId ? activeChainId : -1,
    activeChainId: !!account ? activeChainId : -1,
    ignoreTags: ['coming soon']
  })

  return (
    <NetworkSwitcher
      networksList={networkList}
      show={networkSwitcherPopoverOpen}
      onOuterClick={closeModals}
      placement={placement}
    >
      {children}
    </NetworkSwitcher>
  )
}
