import React, { useCallback } from 'react'
import styled from 'styled-components/macro'
import { Text } from 'rebass'
import { CloseIcon } from 'theme'
import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { MenuItem, PaddedColumn, Separator } from 'components/SearchModal/styleds'
import { ButtonConfirmed, ButtonDropdown, ButtonOutlined } from 'components/Button'
import Badge, { BadgeVariant } from 'components/Badge'
import { X } from 'react-feather'
import { CardSection } from 'components/earn/styled'
import { BlueCard } from 'components/Card'
import { StyledInput } from 'pages/AddLiquidity/styled'
import { TextInput } from 'components/TextInput'
import useTheme from 'hooks/useTheme'

export enum ProposalAction {
  TRANSFER_TOKEN = 'Transfer Token',
  APPROVE_TOKEN = 'Approve Token',
}

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
const ActionSelectorHeader = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
`

const ActionDropdown = styled(ButtonDropdown)`
  padding: 0px;
  background-color: transparent;
  color: ${({ theme }) => theme.text1};
  font-size: 1.25rem;

  :hover,
  :active,
  :focus {
    outline: 0px;
    box-shadow: none;
    background-color: transparent;
  }
`

const ProposalActionSelectorFlex = styled.div`
  margin-top: 10px;
  display: flex;
  flex-flow: column nowrap;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

const ProposalActionSelectorContainer = styled.div`
  flex: 1;
  padding: 1rem;
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: 10px;
`

type ProposalChoice = {
  value: string;
  remove?: (value: string) => void;
}

export const ProposalChoice = (choice: ProposalChoice) => {
  const onRemoveClick = () => {
    choice?.remove && choice.remove(choice.value)
  }

  return (
    <div style={{alignItems:'center',marginRight: 5}}>
      <Badge style={{
        display:'flex', 
        justifyContent: 'space-between', 
        alignItems:'center'
      }}
      variant={BadgeVariant.DEFAULT}>
        <span>{choice.value}</span>
        <X onClick={onRemoveClick} />  
      </Badge> 
    </div>
  )
}

const StyledHeader = styled.div`
font-size:24px;
font-family:"Bangers", cursive;
width:100%;
display:block;
small {
  font-size:12px;
  margin:0;
  line-height:.5;
  padding-right:15px;
}
`
const ProposalChoicesContainer = styled.div`
margin-top: 10px;
padding: 0.75rem 1rem 0.75rem 1rem;
border-radius: 20px;
border: 1px solid ${({ theme }) => theme.bg2};
background-color: ${({ theme }) => theme.bg1};`
export const ProposalChoices = ({
  choices,
  setChoices
}: {
  choices: any[];
  setChoices: (val: any[]) => void;
}) => {
  const [isAdding, setIsAdding] = React.useState(false)
  const [newChoice, setNewChoice] = React.useState<{value?:string}>({value: undefined})
  const saveNewChoice = () => {
    if (newChoice.value) {
    setChoices([...choices, newChoice.value])
    setIsAdding(false)
    setNewChoice({value:undefined})
  } 
  }
  const theme = useTheme()
  return (
    <ProposalChoicesContainer>
      <CardSection>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <StyledHeader>Choices </StyledHeader>
              <ButtonOutlined onClick={( ) => setIsAdding(true)}>Add Choice</ButtonOutlined>
          </div>

          {isAdding && <div style={{padding:'9px 14px', marginTop:15, display:'flex', flexFlow:'column wrap', alignItems:'center'}}>
                <input type='text' style={{
                  width:'100%',
                  padding:20,
                  marginBottom:5,
                  color:"#FFF",
                  background:'transparent',
                  border: `1px solid ${theme.primary1}`
                }} className="token-symbol-container" onChangeCapture={(value) => setNewChoice({ value: value.currentTarget.value })} value={newChoice?.value ?? ""} placeholder={'Enter a description for the voting choice'}  />
                <ButtonConfirmed disabled={!newChoice.value} onClick={saveNewChoice}>Save</ButtonConfirmed>
            </div>}
            
            <div style={{display:'flex', marginTop: 20, flexFlow: 'row wrap', alignItems:'center'}}>
              {choices.length === 0 && <p>No choices have been added yet.</p>}
              {choices.length > 0 && 
              choices.map((choice) => <ProposalChoice 
                                        key={choice} 
                                        value={choice} 
                                        remove={(value) => setChoices([...choices.filter(a => a !== value)])} />
                                        )
              }
            </div>
      </CardSection>
    </ProposalChoicesContainer>
  )
}

export const ProposalActionSelector = ({
  className,
  onClick,
  proposalAction,
}: {
  className?: string
  onClick: () => void
  proposalAction: ProposalAction
}) => {
  return (
    <ProposalActionSelectorFlex>
      <ProposalActionSelectorContainer className={className}>
        <ActionSelectorHeader>
          <Trans>Proposed Action</Trans>
        </ActionSelectorHeader>
        <ActionDropdown onClick={onClick}>{proposalAction}</ActionDropdown>
      </ProposalActionSelectorContainer>
    </ProposalActionSelectorFlex>
  )
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
            <Text fontWeight={500}>
              <Trans>Transfer Token</Trans>
            </Text>
          </Column>
        </MenuItem>
        <MenuItem onClick={() => handleProposalActionSelect(ProposalAction.APPROVE_TOKEN)}>
          <Column>
            <Text fontWeight={500}>
              <Trans>Approve Token</Trans>
            </Text>
          </Column>
        </MenuItem>
      </ContentWrapper>
    </Modal>
  )
}
