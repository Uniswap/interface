import React from 'react'
import styled from 'styled-components'

import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import { useModalOpen, useNetworkModalToggle } from '../../state/application/hooks'

import { ApplicationModal } from '../../state/application/actions'
import { ChainId } from 'libs/sdk/src'
import Modal from '../Modal'
import ModalHeader from '../ModalHeader'
import { useActiveWeb3React } from 'hooks'
import { ButtonEmpty } from 'components/Button'

const PARAMS: {
  [chainId in ChainId]?: {
    chainId: string
    chainName: string
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
    rpcUrls: string[]
    blockExplorerUrls: string[]
  }
} = {
  [ChainId.MAINNET]: {
    chainId: '0x1',
    chainName: 'Ethereum',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3'],
    blockExplorerUrls: ['https://etherscan.com']
  },
  [ChainId.MATIC]: {
    chainId: '0x89',
    chainName: 'Matic',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: [
      //'https://matic-mainnet.chainstacklabs.com/'
      'https://rpc-mainnet.maticvigil.com'
    ],
    blockExplorerUrls: ['https://polygonscan.com/']
  }
}

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 28px 36px 60px 36px;
  width: 100%;
`

const InstructionText = styled.div`
  margin-bottom: 24px;
  font-size: 14px;
`

const NetworkList = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
    width: 100%;
  `};
`

const ListItem = styled.div<{ selected?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: ${({ theme, selected }) => (selected ? theme.bg8 : theme.bg12)};
`

const NetworkLabel = styled.span`
  color: ${({ theme }) => theme.text2};
`

const SelectNetworkButton = styled(ButtonEmpty)`
  background-color: transparent;
  color: ${({ theme }) => theme.primary1};
  display: flex;
  justify-content: center;
  align-items: center;

  &:focus {
    text-decoration: none;
  }
  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary1};
    border-radius: 8px;
  }
  &:active {
    text-decoration: none;
  }
  &:disabled {
    opacity: 50%;
    cursor: not-allowed;
  }
`

export default function NetworkModal(): JSX.Element | null {
  const { chainId, library, account } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()

  if (!chainId) return null

  return (
    <Modal isOpen={networkModalOpen} onDismiss={toggleNetworkModal}>
      <ModalContentWrapper>
        <ModalHeader onClose={toggleNetworkModal} title="Select a Network" />

        <InstructionText>You are currently browsing DMM on the {NETWORK_LABEL[chainId]} network</InstructionText>

        <NetworkList>
          {[ChainId.MAINNET, ChainId.MATIC].map((key: ChainId, i: number) => {
            if (chainId === key) {
              return (
                <SelectNetworkButton key={i} padding="0">
                  <ListItem selected>
                    <img src={NETWORK_ICON[key]} alt="Switch Network" style={{ width: '2rem', marginRight: '1rem' }} />
                    <NetworkLabel>{NETWORK_LABEL[key]}</NetworkLabel>
                  </ListItem>
                </SelectNetworkButton>
              )
            }

            return (
              <SelectNetworkButton
                key={i}
                padding="0"
                onClick={() => {
                  toggleNetworkModal()
                  const params = PARAMS[key]
                  library?.send('wallet_addEthereumChain', [params, account])
                }}
              >
                <ListItem>
                  <img src={NETWORK_ICON[key]} alt="Switch Network" style={{ width: '2rem', marginRight: '1rem' }} />
                  <NetworkLabel>{NETWORK_LABEL[key]}</NetworkLabel>
                </ListItem>
              </SelectNetworkButton>
            )
          })}
        </NetworkList>
      </ModalContentWrapper>
    </Modal>
  )
}
