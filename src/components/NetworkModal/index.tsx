import React from 'react'
import styled, { css } from 'styled-components'
import { t } from '@lingui/macro'

import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import { useModalOpen, useNetworkModalToggle } from '../../state/application/hooks'

import { ApplicationModal } from '../../state/application/actions'
import { ChainId } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
import { ButtonEmpty } from 'components/Button'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import MenuFlyout from 'components/MenuFlyout'
import { isMobile } from 'react-device-detect'

const ModalBrowserStyle = css`
  top: 50px;
  left: 0;
  align-items: flex-start;
  width: 100%;
  background-color: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.text};
  min-width: 180px;
  max-width: 180px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: auto;
    bottom: 52px;
    left: 0;
  `};
`

const NetworkList = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr ${isMobile ? '1fr' : ''};
  width: 100%;
`

const NetworkLabel = styled.span`
  color: ${({ theme }) => theme.text13};
`

const ListItem = styled.div<{ selected?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 12px;
  border-radius: 4px;

  ${({ theme, selected }) =>
    selected
      ? `
        background-color: ${theme.primary};
        & ${NetworkLabel} {
          color: ${theme.bg6};
        }
      `
      : `
        background-color : ${theme.bg12};
      `}
`

const SelectNetworkButton = styled(ButtonEmpty)`
  background-color: transparent;
  color: ${({ theme }) => theme.primary};
  display: flex;
  justify-content: center;
  align-items: center;

  &:focus {
    text-decoration: none;
  }
  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary};
    border-radius: 4px;
  }
  &:active {
    text-decoration: none;
  }
  &:disabled {
    opacity: 50%;
    cursor: not-allowed;
  }
`

export default function NetworkModal(props: { node: any }): JSX.Element | null {
  const { chainId } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()
  const { changeNetwork } = useActiveNetwork()

  if (!chainId || !networkModalOpen) return null

  return (
    <MenuFlyout
      node={props.node}
      browserCustomStyle={ModalBrowserStyle}
      isOpen={networkModalOpen}
      toggle={toggleNetworkModal}
      translatedTitle={t`Select a Network`}
    >
      <NetworkList>
        {[ChainId.MAINNET, ChainId.MATIC, ChainId.BSCMAINNET, ChainId.AVAXMAINNET, ChainId.FANTOM, ChainId.CRONOS].map(
          (key: ChainId, i: number) => {
            if (chainId === key) {
              return (
                <SelectNetworkButton key={i} padding="0">
                  <ListItem selected>
                    <img src={NETWORK_ICON[key]} alt="Switch Network" style={{ width: '24px', marginRight: '8px' }} />
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
                  <img src={NETWORK_ICON[key]} alt="Switch Network" style={{ width: '24px', marginRight: '8px' }} />
                  <NetworkLabel>{NETWORK_LABEL[key]}</NetworkLabel>
                </ListItem>
              </SelectNetworkButton>
            )
          }
        )}
      </NetworkList>
    </MenuFlyout>
  )
}
