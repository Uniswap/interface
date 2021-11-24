import React, { ReactNode, useEffect } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
import { SHOW_TESTNETS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals } from '../../state/application/hooks'
import {
  NetworkSwitcher,
  NetworkOptionProps,
  networkOptionsPreset,
  NetworkList,
  NetworkOptionsPreset
} from '../NetworkSwitcher'

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

  const isOptionDisabled = (networkId: ChainId) => {
    return connector?.supportedChainIds?.indexOf(networkId) === -1 || chainId === networkId
  }

  const options = networkOptionsPreset
    .filter(option => SHOW_TESTNETS || !TESTNETS.includes(option.chainId))
    .map<NetworkOptionProps>(network => {
      const { chainId, logoSrc, name } = network

      return {
        logoSrc,
        header: name,
        disabled: isOptionDisabled(chainId),
        onClick: chainId === ChainId.MAINNET ? selectEthereum : () => selectNetwork(chainId)
      }
    })
  console.log({ options })

  function optionsV3(network: NetworkOptionsPreset) {
    const { chainId, logoSrc, name } = network
    return {
      logoSrc,
      header: name,
      disabled: isOptionDisabled(chainId),
      onClick: chainId === ChainId.MAINNET ? selectEthereum : () => selectNetwork(chainId)
    }
  }

  const tagFilteredArray = networkOptionsPreset.reduce<NetworkList[]>((taggedArray, currentNet) => {
    const tag = currentNet.tag ? currentNet.tag : 'default'
    // check if tag exist and if not create array
    const tagArrIndex = taggedArray.findIndex(existingTagArr => existingTagArr.tag === tag)
    if (tagArrIndex > -1) {
      taggedArray[tagArrIndex].networks.push(optionsV3(currentNet))
    } else {
      taggedArray.push({ tag, networks: [optionsV3(currentNet)] })
    }

    return taggedArray
  }, [])
  console.log({ tagFilteredArray })

  return (
    <NetworkSwitcher
      options={options}
      show={networkSwitcherPopoverOpen}
      onOuterClick={closeModals}
      placement={placement}
      list={tagFilteredArray}
    >
      {children}
    </NetworkSwitcher>
  )
}
