import React, { useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { ChainId, Currency } from 'dxswap-sdk'
import styled from 'styled-components'
import Option from './Option'
import { ButtonPrimary, ButtonSecondary } from '../Button'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals, useWalletModalToggle } from '../../state/application/hooks'
import { network } from '../../connectors'

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

const OptionGrid = styled.div`
  padding: 0.5em 1em 2em 0.75rem;
  display: grid;
  grid-gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `};
`

const ApprovalHint = styled.p`
  font-size: 14px;
  width: 500px;
`

const ApprovalWrapper = styled.div`
  margin-top: 10%;
`

const ButtonWrapper = styled.div`
  margin: 1em auto;
  width: 100%;
`

const ApproveButton = styled(ButtonPrimary)`
  width: 45%;
  padding: 1em;
  margin: 1em;
  font-size: 10px;
  display: inline-block;
`

const IgnoreButton = styled(ButtonSecondary)`
  width: 45%;
  padding: 1em;
  margin: 1em;
  font-size: 10px;
  display: inline-block;
`

export default function NetworkSwitcherPopover() {
  const networkSwitcherPopoverOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)
  const toggleWalletModal = useWalletModalToggle()
  const { chainId } = useWeb3React()
  const closeModals = useCloseModals()
  const [approve, setApprove] = useState(false)

  const customRPCs = [ChainId.XDAI, ChainId.ARBITRUM_TESTNET_V3]

  function AddNetworkApproval() {
    const handleIgnore = () => {
      closeModals()
      setApprove(false)
    }

    const newNetworkId = network.currentChainId

    const handleAddNetwork = () => {
      if (!window.ethereum?.isMetaMask || !window.ethereum?.request || !customRPCs.includes(newNetworkId)) {
        closeModals()
        setApprove(false)
        return
      }

      window.ethereum
        .request({ method: 'wallet_addEthereumChain', params: [NETWORK_DETAILS[newNetworkId]] })
        .catch(error => {
          console.error(`error adding network to metamask`, error)
        })
        .finally(() => {
          closeModals()
          setApprove(false)
        })
    }

    return (
      <ApprovalWrapper>
        <ApprovalHint>
          We have detected that you are using Metamask. Would you like to add {NETWORK_DETAILS[newNetworkId].chainName}{' '}
          to your list of custom RPCs?
        </ApprovalHint>
        <ButtonWrapper>
          <IgnoreButton onClick={handleIgnore}>Ignore</IgnoreButton>
          <ApproveButton onClick={handleAddNetwork}>Add/Switch Network</ApproveButton>
        </ButtonWrapper>
      </ApprovalWrapper>
    )
  }

  function NetworkSelector() {
    const selectNetwork = (optionChainId: ChainId) => {
      network.changeChainId(optionChainId)

      if (chainId && optionChainId === chainId) {
        closeModals()
        return
      }

      if (!window.ethereum?.isMetaMask || !window.ethereum?.request || !customRPCs.includes(optionChainId)) {
        closeModals()
        return
      }

      setApprove(true)
    }

    return (
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
        <Option onClick={toggleWalletModal} header={'Connect Wallet'} />
      </OptionGrid>
    )
  }

  return (
    <Popover content={approve ? <AddNetworkApproval /> : <NetworkSelector />} show={networkSwitcherPopoverOpen}>
      <></>
    </Popover>
  )
}
