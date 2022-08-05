import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

import { NETWORKS_INFO, MAINNET_NETWORKS, SUPPORTED_NETWORKS } from '../../constants/networks'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'

import { ApplicationModal } from 'state/application/actions'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useActiveWeb3React } from 'hooks'
import { ButtonEmpty } from 'components/Button'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import Modal from 'components/Modal'
import { Flex, Text } from 'rebass'
import { X } from 'react-feather'

export const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`

export const NetworkList = styled.div`
  display: grid;
  grid-gap: 1.25rem;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  margin-top: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr;
  `}
`

export const NetworkLabel = styled.span`
  color: ${({ theme }) => theme.text13};
`

export const ListItem = styled.div<{ selected?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
  ${({ theme, selected }) =>
    selected
      ? `
        background-color: ${theme.primary};
        & ${NetworkLabel} {
          color: ${theme.background};
        }
      `
      : `
        background-color : ${theme.buttonBlack};
      `}
`

export const SelectNetworkButton = styled(ButtonEmpty)`
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
  }
  &:active {
    text-decoration: none;
  }
  &:disabled {
    opacity: 50%;
    cursor: not-allowed;
  }
`
const SHOW_NETWORKS = process.env.NODE_ENV === 'production' ? MAINNET_NETWORKS : SUPPORTED_NETWORKS
export default function NetworkModal(): JSX.Element | null {
  const { chainId } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()
  const { changeNetwork } = useActiveNetwork()

  if (!chainId || !networkModalOpen) return null

  return (
    <Modal isOpen={networkModalOpen} onDismiss={toggleNetworkModal} maxWidth={624}>
      <Wrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontWeight="500" fontSize={20}>
            <Trans>Select a Network</Trans>
          </Text>

          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleNetworkModal}>
            <X />
          </Flex>
        </Flex>
        <NetworkList>
          {SHOW_NETWORKS.map((key: ChainId, i: number) => {
            if (chainId === key) {
              return (
                <SelectNetworkButton key={i} padding="0">
                  <ListItem selected>
                    <img
                      src={NETWORKS_INFO[key].icon}
                      alt="Switch Network"
                      style={{ width: '24px', marginRight: '8px' }}
                    />
                    <NetworkLabel>{NETWORKS_INFO[key].name}</NetworkLabel>
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
                  <img
                    src={NETWORKS_INFO[key].icon}
                    alt="Switch Network"
                    style={{ width: '24px', marginRight: '8px' }}
                  />
                  <NetworkLabel>{NETWORKS_INFO[key].name}</NetworkLabel>
                </ListItem>
              </SelectNetworkButton>
            )
          })}
        </NetworkList>
      </Wrapper>
    </Modal>
  )
}
