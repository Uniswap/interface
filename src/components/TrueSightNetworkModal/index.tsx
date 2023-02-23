import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Dispatch, SetStateAction } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { Kyber } from 'components/Icons'
import Modal from 'components/Modal'
import { NETWORKS_INFO, TRENDING_SOON_SUPPORTED_NETWORKS } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { TrueSightFilter } from 'pages/TrueSight'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useTrueSightNetworkModalToggle } from 'state/application/hooks'

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
        background-color : ${theme.buttonBlack};
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
                      {key && NETWORKS_INFO[key].icon ? (
                        <img
                          src={NETWORKS_INFO[key].icon}
                          alt="Switch Network"
                          style={{ width: '24px', marginRight: '8px' }}
                        />
                      ) : (
                        <Kyber size={24} style={{ marginRight: '8px' }} color={theme.background} />
                      )}
                      <NetworkLabel>{key ? NETWORKS_INFO[key].name : t`All Chains`}</NetworkLabel>
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
                    {key && NETWORKS_INFO[key].icon ? (
                      <img
                        src={NETWORKS_INFO[key].icon}
                        alt="Switch Network"
                        style={{ width: '24px', marginRight: '8px' }}
                      />
                    ) : (
                      <Kyber size={24} style={{ marginRight: '8px' }} />
                    )}
                    <NetworkLabel>{key ? NETWORKS_INFO[key].name : t`All Chains`}</NetworkLabel>
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
