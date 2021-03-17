import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { ChainId, Currency } from 'dxswap-sdk'
import styled from 'styled-components'
import Option from './Option'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals, useWalletModalToggle } from '../../state/application/hooks'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.png'
import Popover from '../Popover'

const NETWORK_DETAILS: { [chainId: number]: AddEthereumChainParameter } = {
  [ChainId.MAINNET]: {
    chainId: `0x${ChainId.MAINNET.toString(16)}`,
    chainName: 'Ethereum Main Net',
    nativeCurrency: {
      name: Currency.ETHER.name || 'Ether',
      symbol: Currency.ETHER.symbol || 'ETH',
      decimals: Currency.ETHER.decimals || 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  [ChainId.XDAI]: {
    chainId: `0x${ChainId.XDAI.toString(16)}`,
    chainName: 'xDAI',
    nativeCurrency: {
      name: Currency.XDAI.name || 'xDAI',
      symbol: Currency.XDAI.symbol || 'xDAI',
      decimals: Currency.XDAI.decimals || 18
    },
    rpcUrls: ['https://rpc.xdaichain.com/'],
    blockExplorerUrls: ['https://blockscout.com/xdai/mainnet']
  }
}

interface AddEthereumChainParameter {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
  iconUrls?: string[] // Currently ignored.
}

const ContentWrapper = styled.div`
  padding: 16px 18px 32px 16px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  margin: auto;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

const OptionGrid = styled.div`
  padding: 0.5em 1em 2em 0.75rem;
  display: grid;
  grid-gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `};
`

export default function NetworkSwitcherPopover() {
  const networkSwitcherPopoverOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)
  const closeModals = useCloseModals()

  const toggleWalletModal = useWalletModalToggle()

  const { chainId } = useWeb3React()

  const selectNetwork = (optionChainId: ChainId) => {
    if (optionChainId === chainId) return

    if (!window.ethereum?.isMetaMask || !window.ethereum?.request || !chainId) return

    window.ethereum
      .request({ method: 'wallet_addEthereumChain', params: [NETWORK_DETAILS[optionChainId]] })
      .catch(error => {
        console.error(`error adding network to metamask`, error)
      })

    closeModals()
  }

  return (
    <Popover
      content={
        <OptionGrid>
          <Option
            onClick={() => {
              selectNetwork(ChainId.MAINNET)
            }}
            header={'Ethereum'}
            logoSrc={EthereumLogo}
          />
          <Option
            onClick={() => {
              selectNetwork(ChainId.XDAI)
            }}
            header={'xDai'}
            logoSrc={XDAILogo}
          />
          <Option
            onClick={() => {
              selectNetwork(ChainId.ARBITRUM_TESTNET_V3)
            }}
            header={'Arbitrum'}
            logoSrc={ArbitrumLogo}
            disabled={true}
            clickable={false}
          />
          <Option onClick={toggleWalletModal} header={'Change Wallet'} />
        </OptionGrid>
      }
      show={networkSwitcherPopoverOpen}
    >
      <ContentWrapper></ContentWrapper>
    </Popover>
  )
}
