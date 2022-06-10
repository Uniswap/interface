import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

import { NETWORK_ICON, NETWORK_LABEL, SUPPORTED_NETWORKS } from '../../constants/networks'
import { useWalletModalToggle } from '../../state/application/hooks'

import { ChainId } from '@kyberswap/ks-sdk-core'
import { ButtonEmpty } from 'components/Button'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { Flex, Text } from 'rebass'
import { X } from 'react-feather'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  width: 100%;
  padding: 24px;
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

export default function WrongNetworkModal(): JSX.Element | null {
  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useActiveNetwork()
  const theme = useTheme()

  return (
    <Wrapper>
      <Flex alignItems="center" justifyContent="space-between">
        <Text fontWeight="500" fontSize={20}>
          <Trans>Wrong Network</Trans>
        </Text>

        <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleWalletModal}>
          <X />
        </Flex>
      </Flex>
      <Text fontWeight="500" fontSize={16} color={theme.subText} marginTop={14}>
        <Trans>Please connect to the appropriate network.</Trans>
      </Text>
      <NetworkList>
        {SUPPORTED_NETWORKS.map((key: ChainId, i: number) => {
          return (
            <SelectNetworkButton
              key={i}
              padding="0"
              onClick={() => {
                toggleWalletModal()
                changeNetwork(key)
              }}
            >
              <ListItem>
                <img src={NETWORK_ICON[key]} alt="Switch Network" style={{ width: '24px', marginRight: '8px' }} />
                <NetworkLabel>{NETWORK_LABEL[key]}</NetworkLabel>
              </ListItem>
            </SelectNetworkButton>
          )
        })}
      </NetworkList>
    </Wrapper>
  )
}
