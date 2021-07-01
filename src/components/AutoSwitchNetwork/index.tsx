import React, { useEffect, useState } from 'react'
import { ChainId } from '@fuseio/fuse-swap-sdk'
import { useActiveWeb3React } from '../../hooks'
import ConnectModal from '../ConnectModal'
import useAddChain from '../../hooks/useAddChain'
import { CHAIN_MAP } from '../../constants/chains'

export default function AutoSwitchNetwork({ chainId }: { chainId: number }) {
  const { chainId: activeChainId } = useActiveWeb3React()
  const { addChain, isAddChainEnabled } = useAddChain()
  const [isOpen, setIsOpen] = useState(false)

  // use modal for mainnet and switch automatically for chains in chain map
  useEffect(() => {
    if (chainId !== activeChainId) {
      if (chainId === ChainId.MAINNET) {
        setIsOpen(true)
      } else {
        const chain = CHAIN_MAP[chainId]
        if (chain && isAddChainEnabled) addChain(chain)
      }
    } else {
      // user mannully switched network, close modal
      if (isOpen) {
        setIsOpen(false)
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChainId, addChain, chainId])

  return <ConnectModal setIsOpen={setIsOpen} isOpen={isOpen} chainId={chainId} />
}
