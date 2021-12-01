import React, { ReactNode, useEffect } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
import { SHOW_TESTNETS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals } from '../../state/application/hooks'
import { NetworkSwitcher, networkOptionsPreset, NetworksList, NetworkOptionsPreset } from '../NetworkSwitcher'
import { createNetworksList } from '../../utils/networksList'

interface NetworkSwitcherPopoverProps {
  children: ReactNode
  modal: ApplicationModal
  placement?: Placement
}

const TESTNETS = [4, 421611]

export default function NetworkSwitcherPopover({ children, modal, placement }: NetworkSwitcherPopoverProps) {
  const closeModals = useCloseModals()
  const { connector, chainId, account } = useActiveWeb3React()
  const networkSwitcherPopoverOpen = useModalOpen(modal)

  const { selectEthereum, selectNetwork } = useNetworkSwitch({
    onSelectNetworkCallback: closeModals
  })

  useEffect(() => {
    if (chainId === ChainId.MAINNET) {
      closeModals()
    }
  }, [chainId, closeModals])

  const isNetworkDisabled = (networkId: ChainId) => {
    return connector?.supportedChainIds?.indexOf(networkId) === -1 || chainId === networkId
  }

  function getNetworkOptionsPreset(network: NetworkOptionsPreset) {
    const { chainId } = network
    return {
      preset: network,
      disabled: isNetworkDisabled(chainId),
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
  console.log({ taggedNetworksList })

  const selectorNetworkList = createNetworksList({
    networkOptionsPreset: networkOptionsPreset,
    selectedNetworkChainId: chainId ? chainId : -1,
    setChainId: chainId === ChainId.MAINNET ? selectEthereum : (chainId: ChainId) => selectNetwork(chainId),
    activeChainId: !!account ? chainId : -1,
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
