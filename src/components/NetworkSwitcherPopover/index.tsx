import React, { ReactNode, useCallback, useEffect, useRef } from 'react'
import { ChainId } from '@swapr/sdk'
import styled from 'styled-components'
import Option from './Option'
import { ApplicationModal } from '../../state/application/actions'
import {
  useModalOpen,
  useCloseModals,
  useWalletSwitcherPopoverToggle,
  useEthereumOptionPopoverToggle
} from '../../state/application/hooks'

import EthereumLogo from '../../assets/svg/ethereum-logo.svg'
import XDAILogo from '../../assets/svg/xdai-logo.svg'
import ArbitrumLogo from '../../assets/svg/arbitrum-one-logo.svg'
import Popover from '../Popover'
import { useActiveWeb3React } from '../../hooks'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { NETWORK_DETAIL } from '../../constants'
import { switchOrAddNetwork } from '../../utils'
import { InjectedConnector } from '@web3-react/injected-connector'
import { CustomNetworkConnector } from '../../connectors/CustomNetworkConnector'
import { X } from 'react-feather'
import ethereumHintImage1x from '../../assets/images/ethereum-hint@1x.png'
import ethereumHintImage2x from '../../assets/images/ethereum-hint@2x.png'
import { isMobile } from 'react-device-detect'

const StyledPopover = styled(Popover)`
  padding: 0;
  background-color: ${({ theme }) => theme.bg1};
  border-color: ${({ theme }) => theme.dark2};
  border-style: solid;
  border-width: 1.2px;
  border-radius: 12px;
  border-image: none;
  overflow: hidden;
`

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 10px;
  padding: 22px 22px 15px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
    `};
`

const ChangeWalletButton = styled.button`
  width: 100%;
  padding: 20px 18px;
  font-weight: bold;
  font-size: 11px;
  line-height: 13px;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg1And2};
  border: none;
  outline: none;
  cursor: pointer;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 10px;
  `};
`

interface NetworkSwitcherPopoverProps {
  children: ReactNode
}

export default function NetworkSwitcherPopover({ children }: NetworkSwitcherPopoverProps) {
  const { connector, chainId, account } = useActiveWeb3React()
  const networkSwitcherPopoverOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)
  const ethereumOptionPopoverOpen = useModalOpen(ApplicationModal.ETHEREUM_OPTION)
  const popoverRef = useRef(null)
  const closeModals = useCloseModals()
  useOnClickOutside(popoverRef, () => {
    if (networkSwitcherPopoverOpen || ethereumOptionPopoverOpen) closeModals()
  })

  const selectNetwork = useCallback(
    (optionChainId: ChainId) => {
      if (optionChainId === chainId) return
      if (!!!account && connector instanceof CustomNetworkConnector) connector.changeChainId(optionChainId)
      else if (connector instanceof InjectedConnector)
        switchOrAddNetwork(NETWORK_DETAIL[optionChainId], account || undefined)
      closeModals()
    },
    [account, chainId, closeModals, connector]
  )

  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()

  useEffect(() => {
    if (chainId === ChainId.MAINNET) {
      closeModals()
    }
  }, [chainId, closeModals])

  const isOptionDisabled = (networkId: ChainId) => {
    return connector?.supportedChainIds?.indexOf(networkId) === -1 || chainId === networkId
  }

  const toggleEthereumOptionPopover = useEthereumOptionPopoverToggle()

  const onEthereumOptionClick = () => {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    if (isMobile && isMetamask) {
      closeModals()
      toggleEthereumOptionPopover()
    } else {
      selectNetwork(ChainId.MAINNET)
    }
  }

  return (
    <div ref={popoverRef}>
      <EthereumOptionPopover show={ethereumOptionPopoverOpen}>
        <StyledPopover
          placement="bottom-end"
          content={
            <>
              <OptionGrid>
                <Option
                  onClick={onEthereumOptionClick}
                  disabled={isOptionDisabled(ChainId.MAINNET)}
                  header={'Ethereum'}
                  logoSrc={EthereumLogo}
                />
                <Option
                  onClick={() => selectNetwork(ChainId.XDAI)}
                  disabled={isOptionDisabled(ChainId.XDAI)}
                  header={'xDai'}
                  logoSrc={XDAILogo}
                />
                <Option
                  onClick={() => selectNetwork(ChainId.ARBITRUM_ONE)}
                  disabled={isOptionDisabled(ChainId.ARBITRUM_ONE)}
                  header={'Arbitrum one'}
                  logoSrc={ArbitrumLogo}
                />
              </OptionGrid>
              {!!account && (
                <ChangeWalletButton onClick={toggleWalletSwitcherPopover}>Change wallet</ChangeWalletButton>
              )}
            </>
          }
          show={networkSwitcherPopoverOpen}
        >
          {children}
        </StyledPopover>
      </EthereumOptionPopover>
    </div>
  )
}

interface EthereumOptionPopoverProps {
  children: ReactNode
  show: boolean
}

const View = styled.div`
  max-width: 305px;
  padding: 22px;
`

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
`

const Text = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: ${({ theme }) => theme.text2};
  opacity: 0.8;
`

const CloseButton = styled.button`
  padding: 0;
  margin-left: 16px;
  border: none;
  background: none;

  svg {
    stroke: ${({ theme }) => theme.text2};
  }
`

const Image = styled.img`
  max-width: 100%;
`

const EthereumOptionPopover = ({ children, show }: EthereumOptionPopoverProps) => {
  return (
    <StyledPopover
      placement="bottom-end"
      show={show}
      content={
        <View>
          <Row>
            <Text>Please open up Metamask and Switch to Ethereum manually.</Text>
            <CloseButton>
              <X size="16" />
            </CloseButton>
          </Row>
          <Image src={ethereumHintImage1x} srcSet={ethereumHintImage2x} alt="hint screenshot" />
        </View>
      }
    >
      {children}
    </StyledPopover>
  )
}
