import React, { useCallback } from 'react'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { MenuItem, PaddedColumn, Separator } from 'components/SearchModal/styleds'
import { Text } from 'rebass'
import { CloseIcon } from 'theme'
import Column from 'components/Column'
import styled from 'styled-components'

interface ProposalActionSelectorModalProps {
  isOpen: boolean
  onDismiss: () => void
  onProposalActionSelect: (proposalAction: ProposalAction) => void
}

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
`

export enum ProposalAction {
  TRANSFER_TOKEN = 'Transfer Token',
  APPROVE_TOKEN = 'Approve Token',
}

export default function ActionSelectorModal({
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
              Select an action
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        </PaddedColumn>
        <Separator />
        <MenuItem onClick={() => handleProposalActionSelect(ProposalAction.TRANSFER_TOKEN)}>
          <Column>
            <Text title="Test" fontWeight={500}>
              Transfer Token
            </Text>
          </Column>
        </MenuItem>
        <MenuItem onClick={() => handleProposalActionSelect(ProposalAction.APPROVE_TOKEN)}>
          <Column>
            <Text title="Test" fontWeight={500}>
              Approve Token
            </Text>
          </Column>
        </MenuItem>
      </ContentWrapper>
    </Modal>
  )
}
