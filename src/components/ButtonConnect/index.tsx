import React from 'react'
import { useUnsupportedChainIdError } from '../../hooks'
import { ApplicationModal } from '../../state/application/actions'
import {
  useModalOpen,
  useNetworkSwitcherPopoverToggle,
  useWalletSwitcherPopoverToggle
} from '../../state/application/hooks'
import { ButtonPrimary } from '../Button'

export const ButtonConnect = () => {
  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()
  const toggleNetworkSwitcherPopover = useNetworkSwitcherPopoverToggle()
  const networkSwitcherPopoverOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)
  const unsupportedChainIdError = useUnsupportedChainIdError()
  const isSwitchNetwork = networkSwitcherPopoverOpen || unsupportedChainIdError

  return (
    <ButtonPrimary
      onClick={isSwitchNetwork ? toggleNetworkSwitcherPopover : toggleWalletSwitcherPopover}
      disabled={networkSwitcherPopoverOpen}
      data-testid="switch-connect-button"
    >
      {isSwitchNetwork ? 'Switch network' : 'Connect wallet'}
    </ButtonPrimary>
  )
}
