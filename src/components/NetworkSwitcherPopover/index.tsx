import React, { ReactNode, useCallback, useEffect, useRef } from 'react'
import { ChainId } from 'dxswap-sdk'
import styled from 'styled-components'
import Option from './Option'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals, useWalletSwitcherPopoverToggle } from '../../state/application/hooks'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.jpg'
import Popover from '../Popover'
import { useActiveWeb3React } from '../../hooks'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { NETWORK_DETAIL } from '../../constants'
import { switchOrAddNetwork } from '../../utils'
import { InjectedConnector } from '@web3-react/injected-connector'
import { CustomWalletConnectConnector } from '../../connectors/CustomWalletConnectConnector'
import { CustomNetworkConnector } from '../../connectors/CustomNetworkConnector'

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
  const popoverRef = useRef(null)
  const closeModals = useCloseModals()
  useOnClickOutside(popoverRef, () => {
    if (networkSwitcherPopoverOpen) closeModals()
  })

  const selectNetwork = useCallback(
    (optionChainId: ChainId) => {
      if (optionChainId === chainId) return
      if (
        (!!!account && connector instanceof CustomNetworkConnector) ||
        (!!account && connector instanceof CustomWalletConnectConnector)
      ) {
        connector.changeChainId(optionChainId)
      } else if (connector instanceof InjectedConnector)
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
  
  return (
    <StyledPopover
      innerRef={popoverRef}
      placement="bottom-end"
      content={
        <>
          <OptionGrid>
            <Option
              onClick={() => {
                selectNetwork(ChainId.MAINNET)
              }}
              disabled={isOptionDisabled(ChainId.MAINNET)}
              header={'Ethereum'}
              logoSrc={EthereumLogo}
            />
            <Option
              onClick={() => {
                selectNetwork(ChainId.XDAI)
              }}
              disabled={isOptionDisabled(ChainId.XDAI)}
              header={'xDai'}
              logoSrc={XDAILogo}
            />
            <Option
              onClick={() => {
                selectNetwork(ChainId.ARBITRUM_ONE)
              }}
              disabled={isOptionDisabled(ChainId.ARBITRUM_ONE)}
              header={'Arbitrum one'}
              logoSrc={ArbitrumLogo}
            />
          </OptionGrid>
          {!!account && <ChangeWalletButton onClick={toggleWalletSwitcherPopover}>Change wallet</ChangeWalletButton>}
        </>
      }
      show={networkSwitcherPopoverOpen}
    >
      {children}
    </StyledPopover>
  )
}
