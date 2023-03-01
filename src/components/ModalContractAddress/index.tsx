import { Trans } from '@lingui/macro'
import React from 'react'
import { CheckCircle, Copy, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Divider from 'components/Divider'
import Modal from 'components/Modal'
import { NETWORKS_INFO, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import getShortenAddress from 'utils/getShortenAddress'

function ContractAddressItem({ network, address, lastItem }: { network: string; address: string; lastItem: boolean }) {
  const [isCopied, setCopied] = useCopyClipboard()
  const chainId = TRUESIGHT_NETWORK_TO_CHAINID[network]

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied(address)
  }
  return (
    <>
      <StyledContractAddressItem>
        <Flex alignItems="center" style={{ gap: '4px' }}>
          <img
            src={NETWORKS_INFO[chainId].icon}
            alt="Network"
            style={{ minWidth: '16px', width: '16px', marginRight: '6px' }}
          />
          <div style={{ width: '90px', fontSize: '14px' }}>{getShortenAddress(address)}</div>
        </Flex>
        <Flex alignItems="center" onClick={onCopy}>
          {isCopied ? <CheckCircle size={'14'} /> : <Copy size={'14'} />}
        </Flex>
      </StyledContractAddressItem>
      {!lastItem && <Divider style={{ margin: '16px 0' }} />}
    </>
  )
}

const ModalContractAddress = ({ platforms }: { platforms: Map<string, string> }) => {
  const isContractAddressModalOpen = useModalOpen(ApplicationModal.CONTRACT_ADDRESS)
  const toggleContractAddressModal = useToggleModal(ApplicationModal.CONTRACT_ADDRESS)

  const theme = useTheme()

  return (
    <Modal isOpen={isContractAddressModalOpen} onDismiss={toggleContractAddressModal}>
      <Container>
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontWeight={500}>
            <Trans>Contract Address</Trans>
          </Text>
          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleContractAddressModal}>
            <X size={20} color={theme.subText} />
          </Flex>
        </Flex>
        <ContractAddressContainer>
          {Array.from(platforms).map((platformEntry, index) => {
            return (
              <ContractAddressItem
                key={index}
                network={platformEntry[0]}
                address={platformEntry[1]}
                lastItem={platforms.size === index + 1}
              />
            )
          })}
        </ContractAddressContainer>
      </Container>
    </Modal>
  )
}

export default ModalContractAddress

const Container = styled.div`
  width: 100%;
  padding: 24px 16px 40px;
`

const ContractAddressContainer = styled.div`
  margin-top: 28px;
`

const StyledContractAddressItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
