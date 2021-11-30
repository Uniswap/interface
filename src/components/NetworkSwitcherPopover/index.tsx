import React, { ReactNode, useEffect } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
import { SHOW_TESTNETS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals } from '../../state/application/hooks'
import { NetworkSwitcher, networkOptionsPreset, NetworksList, NetworkOptionsPreset } from '../NetworkSwitcher'

interface NetworkSwitcherPopoverProps {
  children: ReactNode
  modal: ApplicationModal
  placement?: Placement
}

const TESTNETS = [4, 46211]

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

  const isNetDisabled = (networkId: ChainId) => {
    return connector?.supportedChainIds?.indexOf(networkId) === -1 || chainId === networkId
  }

  function getNetworkOptionsPreset(network: NetworkOptionsPreset) {
    const { chainId } = network
    return {
      preset: network,
      disabled: isNetDisabled(chainId),
      onClick: chainId === ChainId.MAINNET ? selectEthereum : () => selectNetwork(chainId)
    }
  }

  const taggedNetworksList = networkOptionsPreset
    .filter(network => SHOW_TESTNETS || !TESTNETS.includes(network.chainId))
    .reduce<NetworksList[]>((taggedArray, currentNetwork) => {
      const tag = currentNetwork.tag ? currentNetwork.tag : ''
      const enhancedNet = getNetworkOptionsPreset(currentNetwork)

      // check if tag exist and if not create array
      const tagArrIndex = taggedArray.findIndex(existingTagArr => existingTagArr.tag === tag)
      if (tagArrIndex > -1) {
        taggedArray[tagArrIndex].networks.push(enhancedNet)
      } else {
        taggedArray.push({ tag, networks: [enhancedNet] })
      }
      return taggedArray
    }, [])

  return (
    <NetworkSwitcher
      networksList={taggedNetworksList}
      show={networkSwitcherPopoverOpen}
      onOuterClick={closeModals}
      placement={placement}
    >
      {children}
    </NetworkSwitcher>
  )
}
