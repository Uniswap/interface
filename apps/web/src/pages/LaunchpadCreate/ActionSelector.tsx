import { ButtonDropdown } from 'components/Button'
import Column from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { MenuItem, PaddedColumn, Separator } from 'components/SearchModal/styled'
import { Trans } from 'i18n'
import { useCallback, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'
import { CloseIcon } from 'theme/components'

export interface Action {
  id: string
  name: string
}

export interface ActionSelectorProps {
  title: string
  items: Action[]
  selectedAction: string
  className?: string
  onActionSelect: (selectedAction: string) => void
}

interface ActionSelectorModalProps {
  items: Action[]
  isOpen: boolean
  onDismiss: () => void
  onActionSelect: (selectedAction: string) => void
}

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
`
const ActionSelectorHeader = styled.div`
  font-size: 14px;
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
  margin-bottom: 10px;
`

const ActionDropdown = styled(ButtonDropdown)`
  padding: 0px;
  background-color: transparent;
  color: ${({ theme }) => theme.neutral1};
  font-size: 1.25rem;

  :hover,
  :active,
  :focus {
    outline: 0px;
    box-shadow: none;
    background-color: transparent;
  }
`

const ActionSelectorFlex = styled.div`
  display: flex;
  flex-flow: column nowrap;
  z-index: 1;
  width: 100%;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  background-color: ${({ theme }) => theme.surface1};
`

const ActionSelectorContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-start;
  flex-direction: column;
  padding: 1em;
`

export const ActionSelector = ({ title, items, selectedAction, className, onActionSelect }: ActionSelectorProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  const onClick = useCallback(() => {
    setModalOpen(true)
  }, [setModalOpen])

  const handleDismiss = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const item = useMemo(() => {
    return items.find((i) => i.id == selectedAction)
  }, [items, selectedAction])

  return (
    <>
      <ActionSelectorFlex>
        <ActionSelectorContainer className={className}>
          <ActionSelectorHeader>
            <Trans>{title}</Trans>
          </ActionSelectorHeader>
          <ActionDropdown onClick={onClick}>{item?.name || '-'}</ActionDropdown>
        </ActionSelectorContainer>
      </ActionSelectorFlex>
      <ActionSelectorModal
        isOpen={modalOpen}
        onDismiss={handleDismiss}
        items={items}
        onActionSelect={onActionSelect}
      ></ActionSelectorModal>
    </>
  )
}

export function ActionSelectorModal({ items, isOpen, onDismiss, onActionSelect }: ActionSelectorModalProps) {
  const handleActionSelect = useCallback(
    (item: string) => {
      onActionSelect(item)
      onDismiss()
    },
    [onDismiss, onActionSelect]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <ContentWrapper>
        <PaddedColumn gap="16px">
          <RowBetween>
            <Text fontWeight={535} fontSize={16}>
              <Trans>Select an action</Trans>
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        </PaddedColumn>
        <Separator />
        {items.map((item) => (
          <MenuItem onClick={() => handleActionSelect(item.id)} key={item.id}>
            <Column>
              <Text fontWeight={535}>{item.name}</Text>
            </Column>
          </MenuItem>
        ))}
      </ContentWrapper>
    </Modal>
  )
}
