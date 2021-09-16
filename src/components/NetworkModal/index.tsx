import React from 'react'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import { useModalOpen, useNetworkModalToggle } from '../../state/application/hooks'

import { ApplicationModal } from '../../state/application/actions'
import { ChainId } from 'libs/sdk/src'
import ModalHeader from '../ModalHeader'
import { useActiveWeb3React } from 'hooks'
import { ButtonEmpty } from 'components/Button'
import { useActiveNetwork } from 'hooks/useActiveNetwork'

const ModalContentWrapper = styled.div`
  position: absolute;
  top: 50px;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg19};
  color: ${({ theme }) => theme.text1};
  min-width: 272px;
  max-width: 272px;
  border-radius: 16px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: auto;
    bottom: 52px;
    left: 0;
  `};
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
  color: ${({ theme }) => theme.text13};
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
  const { chainId } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()
  const { changeNetwork } = useActiveNetwork()

  if (!chainId || !networkModalOpen) return null

  return (
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
                  <img src={NETWORK_ICON[key]} alt="Switch Network" style={{ width: '24px', marginRight: '12px' }} />
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
                <img src={NETWORK_ICON[key]} alt="Switch Network" style={{ width: '24px', marginRight: '12px' }} />
                <NetworkLabel>{NETWORK_LABEL[key]}</NetworkLabel>
              </ListItem>
            </SelectNetworkButton>
          )
        })}
      </NetworkList>
    </ModalContentWrapper>
  )
}
