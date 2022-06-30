import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

import { NETWORKS_INFO } from '../../constants/networks'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'

import { ApplicationModal } from '../../state/application/actions'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ButtonEmpty } from 'components/Button'
import Modal from 'components/Modal'
import { Flex, Text } from 'rebass'
import { X } from 'react-feather'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`

const NetworkList = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  margin-top: 20px;
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
          color: ${theme.background};
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

export default function SelectNetworkModal({
  chainId = ChainId.MAINNET,
  onNetworkSelect,
}: {
  chainId: ChainId | undefined
  onNetworkSelect: (chainId: number) => void
}): JSX.Element | null {
  const networkModalOpen = useModalOpen(ApplicationModal.REFERRAL_NETWORK)
  const toggle = useToggleModal(ApplicationModal.REFERRAL_NETWORK)

  if (!chainId || !networkModalOpen) return null

  return (
    <Modal isOpen={networkModalOpen} onDismiss={toggle}>
      <Wrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontWeight="500" fontSize={18}>
            <Trans>Select a Network</Trans>
          </Text>

          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggle}>
            <X />
          </Flex>
        </Flex>
        <NetworkList>
          {[
            ChainId.MAINNET,
            ChainId.MATIC,
            ChainId.BSCMAINNET,
            ChainId.AVAXMAINNET,
            ChainId.FANTOM,
            ChainId.CRONOS,
            ChainId.ARBITRUM,
            ChainId.AURORA,
          ].map((key: ChainId, i: number) => {
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
                  toggle()
                  onNetworkSelect(key)
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
