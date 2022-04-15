import React, { Dispatch, SetStateAction } from 'react'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { NETWORK_ICON, NETWORK_LABEL } from 'constants/networks'
import { useModalOpen, useTrueSightNetworkModalToggle } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import { ChainId } from '@dynamic-amm/sdk'
import { ButtonEmpty } from 'components/Button'
import Modal from 'components/Modal'
import { Flex, Text } from 'rebass'
import { X } from 'react-feather'
import { TrueSightFilter } from 'pages/TrueSight'
import { Kyber } from 'components/Icons'
import { TRENDING_SOON_SUPPORTED_NETWORKS } from 'constants/index'
import useTheme from 'hooks/useTheme'

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

export default function TrueSightNetworkModal({
  filter,
  setFilter,
}: {
  filter: TrueSightFilter
  setFilter: Dispatch<SetStateAction<TrueSightFilter>>
}): JSX.Element | null {
  const theme = useTheme()
  const trueSightNetworkModalOpen = useModalOpen(ApplicationModal.TRUESIGHT_NETWORK)
  const toggleTrueSightNetworkModal = useTrueSightNetworkModalToggle()

  if (!trueSightNetworkModalOpen) return null

  return (
    <Modal isOpen={trueSightNetworkModalOpen} onDismiss={toggleTrueSightNetworkModal}>
      <Wrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontWeight="500" fontSize={18}>
            <Trans>Filter tokens by chain</Trans>
          </Text>

          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleTrueSightNetworkModal}>
            <X />
          </Flex>
        </Flex>
        <NetworkList>
          {[undefined, ...Object.values(TRENDING_SOON_SUPPORTED_NETWORKS)].map(
            (key: ChainId | undefined, i: number) => {
              if (filter.selectedNetwork === key) {
                return (
                  <SelectNetworkButton key={i} padding="0">
                    <ListItem selected>
                      {key && NETWORK_ICON[key] ? (
                        <img
                          src={NETWORK_ICON[key]}
                          alt="Switch Network"
                          style={{ width: '24px', marginRight: '8px' }}
                        />
                      ) : (
                        <Kyber size={24} style={{ marginRight: '8px' }} color={theme.background} />
                      )}
                      <NetworkLabel>{key ? NETWORK_LABEL[key] : t`All Chains`}</NetworkLabel>
                    </ListItem>
                  </SelectNetworkButton>
                )
              }

              return (
                <SelectNetworkButton
                  key={i}
                  padding="0"
                  onClick={() => {
                    toggleTrueSightNetworkModal()
                    setFilter(prev => ({ ...prev, selectedNetwork: key }))
                  }}
                >
                  <ListItem>
                    {key && NETWORK_ICON[key] ? (
                      <img src={NETWORK_ICON[key]} alt="Switch Network" style={{ width: '24px', marginRight: '8px' }} />
                    ) : (
                      <Kyber size={24} style={{ marginRight: '8px' }} />
                    )}
                    <NetworkLabel>{key ? NETWORK_LABEL[key] : t`All Chains`}</NetworkLabel>
                  </ListItem>
                </SelectNetworkButton>
              )
            },
          )}
        </NetworkList>
      </Wrapper>
    </Modal>
  )
}
