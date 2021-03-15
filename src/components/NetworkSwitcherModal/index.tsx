import React from 'react'
import { ChainId } from 'dxswap-sdk'
import styled from 'styled-components'
// import Modal from '../Modal'
import Option from './Option'
import { transparentize } from 'polished'
// import { ReactComponent as Close } from '../../assets/images/x.svg'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen /*, useNetworkSwitcherModalToggle */ } from '../../state/application/hooks'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.png'
import { useWeb3React } from '@web3-react/core'
import Popover from '../Popover'
import DropdownArrow from '../../assets/images/dropdown.svg'

const ChainLabel: any = {
  [ChainId.MAINNET]: 'Ethereum Mainnet',
  [ChainId.RINKEBY]: 'Rinkeby Testnet',
  [ChainId.ARBITRUM_TESTNET_V3]: 'Arbitrum Testnet',
  [ChainId.SOKOL]: 'Sokol Testnet',
  [ChainId.XDAI]: 'xDai Network'
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

export default function NetworkSwitcherModal() {
  const networkSwitcherModalOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)

  return (
    <Popover
      content={
        <OptionGrid>
          <Option chainId={ChainId.MAINNET} header={'Ethereum'} logoSrc={EthereumLogo} />
          <Option chainId={ChainId.XDAI} header={'xDai'} logoSrc={XDAILogo} />
          <Option
            chainId={ChainId.ARBITRUM_TESTNET_V3}
            header={'Arbitrum'}
            logoSrc={ArbitrumLogo}
            disabled={true}
            clickable={false}
          />
          <Option chainId={-1} header={'Change Wallet'} />
        </OptionGrid>
      }
      show={networkSwitcherModalOpen}
    >
      <ContentWrapper></ContentWrapper>
    </Popover>
  )
}
