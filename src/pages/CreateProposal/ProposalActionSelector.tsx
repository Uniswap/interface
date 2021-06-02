import React, { useCallback } from 'react'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { MenuItem, PaddedColumn, Separator } from 'components/SearchModal/styleds'
import { Text } from 'rebass'
import { CloseIcon } from 'theme'
import Column from 'components/Column'
import styled from 'styled-components'
import { ButtonDropdown } from 'components/Button'
import { Trans } from '@lingui/macro'

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
`

export enum ProposalAction {
  TRANSFER_TOKEN = 'Transfer Token',
  APPROVE_TOKEN = 'Approve Token',
}

const _ProposalActionSelector = ({
  className,
  onClick,
  proposalAction,
}: {
  className?: string
  onClick: () => void
  proposalAction: ProposalAction
}) => {
  const ActionSelectorHeader = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.text2};
  `

  const ActionDropdown = styled(ButtonDropdown)`
      padding: 0px;
      margin-top: 10px;
      background-color: transparent;
      color: ${({ theme }) => theme.text1}
      font-size: 24px;
  
      :hover,
      :active,
      :focus {
        outline: 0px;
        box-shadow: none;
        background-color: transparent;
      }
    `

  return (
    <div className={className}>
      <ActionSelectorHeader>
        <Trans>Proposed Action</Trans>
      </ActionSelectorHeader>
      <ActionDropdown onClick={onClick}>{proposalAction}</ActionDropdown>
    </div>
  )
}

export const ProposalActionSelector = styled(_ProposalActionSelector)`
  padding: 0.75rem 0.5rem 0.75rem 1rem;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

interface ProposalActionSelectorModalProps {
  isOpen: boolean
  onDismiss: () => void
  onProposalActionSelect: (proposalAction: ProposalAction) => void
}

export function ProposalActionSelectorModal({
  isOpen,
  onDismiss,
  onProposalActionSelect,
}: ProposalActionSelectorModalProps) {
  const handleProposalActionSelect = useCallback(
    (proposalAction: ProposalAction) => {
      onProposalActionSelect(proposalAction)
      onDismiss()
    },
    [onDismiss, onProposalActionSelect]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <ContentWrapper>
        <PaddedColumn gap="16px">
          <RowBetween>
            <Text fontWeight={500} fontSize={16}>
              <Trans>Select an action</Trans>
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        </PaddedColumn>
        <Separator />
        <MenuItem onClick={() => handleProposalActionSelect(ProposalAction.TRANSFER_TOKEN)}>
          <Column>
            <Text title="Test" fontWeight={500}>
              <Trans>Transfer Token</Trans>
            </Text>
          </Column>
        </MenuItem>
        <MenuItem onClick={() => handleProposalActionSelect(ProposalAction.APPROVE_TOKEN)}>
          <Column>
            <Text title="Test" fontWeight={500}>
              <Trans>Approve Token</Trans>
            </Text>
          </Column>
        </MenuItem>
      </ContentWrapper>
    </Modal>
  )
}
