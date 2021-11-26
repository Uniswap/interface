import React, { ReactNode, useEffect } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
import { SHOW_TESTNETS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals } from '../../state/application/hooks'
import { NetworkSwitcher, networkOptionsPreset, NetworkList, NetworkOptionsPreset } from '../NetworkSwitcher'

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

  const isOptionDisabled = (networkId: ChainId, tag?: string) => {
    return connector?.supportedChainIds?.indexOf(networkId) === -1 || chainId === networkId || tag === 'coming soon'
  }

  function getNetOptionsPreset(network: NetworkOptionsPreset) {
    const { chainId, logoSrc, name, tag } = network
    return {
      logoSrc,
      header: name,
      disabled: isOptionDisabled(chainId, tag),
      onClick: chainId === ChainId.MAINNET ? selectEthereum : () => selectNetwork(chainId)
    }
  }

  const taggedNetworksList = networkOptionsPreset
    .filter(network => SHOW_TESTNETS || !TESTNETS.includes(network.chainId))
    .reduce<NetworkList[]>((taggedArray, currentNet) => {
      const tag = currentNet.tag ? currentNet.tag : ''
      const enhancedNet = getNetOptionsPreset(currentNet)
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
