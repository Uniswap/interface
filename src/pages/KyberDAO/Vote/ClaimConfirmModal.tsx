import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

import KNCLogo from '../kncLogo'

const Wrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const AddressWrapper = styled.div`
  border-radius: 8px;
  border: none;
  outline: none;
  padding: 10px 12px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  ${({ theme }) => css`
    background-color: ${theme.buttonBlack};
    color: ${theme.subText};
    :disabled {
      color: ${theme.border};
    }
  `}
`

export default function ClaimConfirmModal({ amount, onConfirmClaim }: { amount: string; onConfirmClaim: () => void }) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const modalOpen = useModalOpen(ApplicationModal.KYBER_DAO_CLAIM)
  const toggleModal = useToggleModal(ApplicationModal.KYBER_DAO_CLAIM)
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal}>
      <Wrapper>
        <RowBetween>
          <AutoRow gap="2px">
            <Text fontSize={20}>
              <Trans>Claim your KNC rewards</Trans>
            </Text>
          </AutoRow>
          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
            <X onClick={toggleModal} size={20} color={theme.subText} />
          </Flex>
        </RowBetween>
        <AddressWrapper>
          <Text fontSize={12}>
            <Trans>Your wallet address</Trans>
          </Text>
          <Text color={theme.border}>{account}</Text>
        </AddressWrapper>
        <Text fontSize={16} lineHeight="24px" fontWeight={400} color={theme.text}>
          <Trans>If your wallet is eligible, you will be able to claim your reward below:</Trans>
        </Text>
        <RowFit gap="10px">
          <KNCLogo size={28} /> <Text fontSize={32}>{amount} KNC</Text>
        </RowFit>
        <ButtonPrimary onClick={onConfirmClaim}>Claim</ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}
