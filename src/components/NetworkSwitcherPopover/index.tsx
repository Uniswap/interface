import React, { ReactNode, useCallback, useRef } from 'react'
import { ChainId } from 'dxswap-sdk'
import styled from 'styled-components'
import Option from './Option'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useCloseModals, useAddPopup } from '../../state/application/hooks'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.jpg'
import Popover from '../Popover'
import { useActiveWeb3React } from '../../hooks'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { NETWORK_DETAIL } from '../../constants'
import { CustomNetworkConnector } from '../../connectors/CustomNetworkConnector'

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `};
`

export default function NetworkSwitcherPopover({ children }: { children: ReactNode }) {
  const { connector } = useActiveWeb3React()
  const networkSwitcherPopoverOpen = useModalOpen(ApplicationModal.NETWORK_SWITCHER)
  const popoverRef = useRef(null)
  const addPopup = useAddPopup()
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
        window.ethereum.isMetaMask &&
        NETWORK_DETAIL[optionChainId] &&
        NETWORK_DETAIL[optionChainId].metamaskAddable
      ) {
        addPopup({ newNetworkChainId: optionChainId }, false)
      }
      closeModals()
    },
    [account, addPopup, chainId, closeModals, connector]
  )

  return (
    <div ref={popoverRef} style={{ height: 22 }}>
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
                selectNetwork(ChainId.ARBITRUM_ONE)
              }}
              header={'Arbitrum one'}
              logoSrc={ArbitrumLogo}
            />
          </OptionGrid>
        }
        show={networkSwitcherPopoverOpen}
      >
        {children}
      </Popover>
    </div>
  )
}
