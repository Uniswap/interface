import React, { ReactNode, useCallback, useRef } from 'react'
import { ChainId } from 'dxswap-sdk'
import styled from 'styled-components'
import Option from './Option'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals } from '../../state/application/hooks'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.jpg'
import Popover from '../Popover'
import { useActiveWeb3React } from '../../hooks'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { NETWORK_DETAIL } from '../../constants'
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
`;

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 10px;
  padding: 22px 22px 15px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
    `};
`

const PopoverFooter = styled.div`
  padding: 20px 18px;
  font-weight: bold;
  font-size: 11px;
  line-height: 13px;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg1And2};
`;

export default function NetworkSwitcherPopover({ children }: { children: ReactNode }) {
  const { connector } = useActiveWeb3React()
  const networkSwitcherPopoverOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)
  const popoverRef = useRef(null)
  const closeModals = useCloseModals()
  useOnClickOutside(popoverRef, () => {
    if (networkSwitcherPopoverOpen) closeModals()
  })

  const { chainId, account } = useActiveWeb3React()

  const selectNetwork = useCallback(
    (optionChainId: ChainId) => {
      if (optionChainId === chainId) return
      if (!!!account && connector instanceof CustomNetworkConnector) connector.changeChainId(optionChainId)
      if (
        window.ethereum &&
        window.ethereum.request &&
        window.ethereum.isMetaMask &&
        NETWORK_DETAIL[optionChainId] &&
        NETWORK_DETAIL[optionChainId].metamaskAddable
      ) {
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ ...NETWORK_DETAIL[optionChainId], metamaskAddable: undefined }]
        })
        .catch(error => {
          console.error(`error adding network to metamask`, error)
        })
      }
      closeModals()
    },
    [account, chainId, closeModals, connector]
  )
  
  return (
    <div ref={popoverRef}>
      <StyledPopover
        content={
          <>
            <OptionGrid>
              <Option
                onClick={() => {
                  selectNetwork(ChainId.MAINNET)
                }}
                header={'Ethereum'}
                logoSrc={EthereumLogo}
                disabled={chainId === ChainId.MAINNET}
              />
              <Option
                onClick={() => {
                  selectNetwork(ChainId.XDAI)
                }}
                header={'xDai'}
                logoSrc={XDAILogo}
                disabled={chainId === ChainId.XDAI}
              />
              <Option
                onClick={() => {
                  selectNetwork(ChainId.ARBITRUM_TESTNET_V3)
                }}
                header={'Arbitrum'}
                logoSrc={ArbitrumLogo}
                comingSoon
              />
            </OptionGrid>
            <PopoverFooter>change wallet</PopoverFooter>
          </>
        }
        show={networkSwitcherPopoverOpen}
      >
        {children}
      </StyledPopover>
    </div>
  )
}
