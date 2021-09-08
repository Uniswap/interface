import React from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../state'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import { useModalOpen, useNetworkModalToggle } from '../../state/application/hooks'
import { updateChainIdWhenNotConnected } from '../../state/application/actions'

import { ApplicationModal } from '../../state/application/actions'
import { ChainId } from 'libs/sdk/src'
import Modal from '../Modal'
import ModalHeader from '../ModalHeader'
import { useActiveWeb3React } from 'hooks'
import { ButtonEmpty } from 'components/Button'

const SWITCH_NETWORK_PARAMS: {
  [chainId in ChainId]?: {
    chainId: string
  }
} = {
  [ChainId.MAINNET]: {
    chainId: '0x1'
  },
  [ChainId.MATIC]: {
    chainId: '0x89'
  },
  [ChainId.BSCMAINNET]: {
    chainId: '0x38'
  },
  [ChainId.AVAXMAINNET]: {
    chainId: '0xA86A'
  }
}

const ADD_NETWORK_PARAMS: {
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
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon.dmm.exchange/v1/mainnet/geth?appId=prod-dmm'],
    blockExplorerUrls: ['https://polygonscan.com/']
  },
  [ChainId.BSCMAINNET]: {
    chainId: '0x38',
    chainName: 'BSC',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
  },
  [ChainId.AVAXMAINNET]: {
    chainId: '0xA86A',
    chainName: 'AVAX',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://cchain.explorer.avax.network/']
  }
}

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg2};
`

const InstructionText = styled.div`
  margin-bottom: 24px;
  font-size: 14px;
`

const NetworkList = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr;
  width: 100%;
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

export default function NetworkModal({ isNotConnected }: { isNotConnected: boolean }): JSX.Element | null {
  const { chainId, library, account } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()

  const dispatch = useDispatch<AppDispatch>()
  if (!chainId) return null

  const changeNetwork = async (key: ChainId) => {
    if (isNotConnected) {
      dispatch(updateChainIdWhenNotConnected(key))
    } else {
      const switchNetworkParams = SWITCH_NETWORK_PARAMS[key]
      const addNetworkParams = ADD_NETWORK_PARAMS[key]

      try {
        await library?.send('wallet_switchEthereumChain', [switchNetworkParams, account])
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902 || switchError.code === -32603) {
          try {
            library?.send('wallet_addEthereumChain', [addNetworkParams, account])
          } catch (addError) {
            console.error(addError)
          }
        } else {
          // handle other "switch" errors
          console.error(switchError)
        }
      }
    }
  }

  return (
    <Modal isOpen={networkModalOpen} onDismiss={toggleNetworkModal} maxWidth={272}>
      <ModalContentWrapper>
        <ModalHeader title={t`Select a Network`} />

        <InstructionText>
          <Trans>You are currently browsing DMM on the {NETWORK_LABEL[chainId]}</Trans>
        </InstructionText>

        <NetworkList>
          {[ChainId.MAINNET, ChainId.MATIC, ChainId.BSCMAINNET, ChainId.AVAXMAINNET].map((key: ChainId, i: number) => {
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
                  changeNetwork(key)
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
