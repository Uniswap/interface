import React, { useCallback, useState } from 'react'
import AppBody from '../AppBody'
import { CreateProposalTabs } from '../../components/NavigationTabs'
import { Wrapper } from 'pages/Pool/styleds'
import styled from 'styled-components'
import { ButtonDropdown } from 'components/Button'
import { TextArea, TextInput } from 'components/TextInput'
import { AutoColumn } from 'components/Column'
import { BlueCard } from 'components/Card'
import { Button, TYPE } from 'theme'
import AddressInputPanel from 'components/AddressInputPanel'
import ProposalActionSelectorModal, { ProposalAction } from './ProposalActionSelectorModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Currency } from '@uniswap/sdk-core'
import { currencyId } from 'utils/currencyId'
import { useCurrency } from 'hooks/Tokens'

const ProposalWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
`

const _ProposalActionPane = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  return <div className={className}>{children}</div>
}

const _ProposalEditorPane = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  return <div className={className}>{children}</div>
}

const ProposalActionPane = styled(_ProposalActionPane)`
  flex: 1 400px;
`
const ProposalEditorPane = styled(_ProposalEditorPane)`
  flex: 1 400px;
`

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
    color: ${({ theme }) => theme.text2};
  `

  const ActionDropdown = styled(ButtonDropdown)`
    padding: 0px;
    margin-top: 10px;
    background-color: transparent;
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
      <ActionSelectorHeader>Proposed Action</ActionSelectorHeader>
      <ActionDropdown onClick={onClick}>{proposalAction}</ActionDropdown>
    </div>
  )
}

const ProposalActionSelector = styled(_ProposalActionSelector)`
  padding: 0.75rem 0.5rem 0.75rem 1rem;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

const _ProposalActionDetail = ({
  className,
  proposalAction,
}: {
  className?: string
  proposalAction: ProposalAction
}) => {
  // Transfer token
  const [tokenAddressValue, setTokenAddressValue] = useState('')
  const [toAddressValue, setToAddressValue] = useState('')
  const [amountValue, setAmountValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState(useCurrency('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'))

  const onTokenAddressUserInput = useCallback((tokenAddressValue: string) => {
    setTokenAddressValue(tokenAddressValue)
  }, [])

  const onToAddressUserInput = useCallback((toAddressValue: string) => {
    setToAddressValue(toAddressValue)
  }, [])

  const onAmountInput = useCallback((amountValue: string) => [setAmountValue(amountValue)], [])

  const onCurrencySelect = useCallback((currency: Currency) => {
    setCurrencyValue(currency)
  }, [])

  return (
    <div className={className}>
      {proposalAction === ProposalAction.TRANSFER_TOKEN ? (
        <>
          <AddressInputPanel
            className="to-address-input"
            label="To"
            value={toAddressValue}
            onChange={onToAddressUserInput}
          />
          <CurrencyInputPanel
            value={amountValue}
            currency={currencyValue}
            onUserInput={(value: string) => onAmountInput(value)}
            onCurrencySelect={(currency: Currency) => onCurrencySelect(currency)}
            showMaxButton={false}
            showCommonBases={false}
            hideBalance={true}
            id="token-transfer-amount"
          />
        </>
      ) : (
        <>
          <AddressInputPanel
            className="to-address-input"
            label="To"
            value={toAddressValue}
            onChange={onToAddressUserInput}
          />
          <CurrencyInputPanel
            value={amountValue}
            currency={currencyValue}
            onUserInput={(value: string) => onAmountInput(value)}
            onCurrencySelect={(currency: Currency) => onCurrencySelect(currency)}
            showMaxButton={false}
            showCommonBases={false}
            hideBalance={true}
            id="token-transfer-amount"
          />
        </>
      )}
    </div>
  )
}

const ProposalActionDetail = styled(_ProposalActionDetail)`
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-gap: 10px;
`

const ProposalEditorHeader = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text2};
`

const ProposalTitle = styled(TextInput)`
  margin-top: 7.5px;
  margin-bottom: 7.5px;
`

const ProposalBody = styled(TextArea)`
  margin-top: 15px;
  margin-bottom: 7.5px;
`

const _ProposalEditor = ({ className }: { className?: string }) => {
  const [titleValue, setTitleValue] = useState('')
  const [bodyValue, setBodyValue] = useState('')

  const onTitleUserInput = useCallback((titleValue: string) => {
    setTitleValue(titleValue)
  }, [])

  const onBodyUserInput = useCallback((bodyValue: string) => {
    setBodyValue(bodyValue)
  }, [])

  const bodyPlaceholder = `# Heading 1

Lorem ipsum dolor sit amet

## Heading 2

Lorem ipsum dolor sit amet

`

  return (
    <div className={className}>
      <ProposalEditorHeader>Proposal</ProposalEditorHeader>
      <ProposalTitle value={titleValue} onUserInput={onTitleUserInput} placeholder="Proposal Title" fontSize="1.5rem" />
      <hr />
      <ProposalBody value={bodyValue} onUserInput={onBodyUserInput} placeholder={bodyPlaceholder} fontSize="1rem" />
    </div>
  )
}

const ProposalEditor = styled(_ProposalEditor)`
  padding: 0.75rem 0.5rem 0.75rem 1rem;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

const CreateProposalButton = styled(Button)`
  margin-top: 18px;
`

type AppBodyProps = {
  maxWidth: string
}

export default function CreateProposal() {
  const appBodyProps: AppBodyProps = { maxWidth: '1200px' }
  const [modalOpen, setModalOpen] = useState(false)
  const [proposalAction, setProposalAction] = useState(ProposalAction.TRANSFER_TOKEN)

  const handleDismissActionSelector = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const handleActionSelectorClick = useCallback(() => {
    setModalOpen(true)
  }, [setModalOpen])

  const handleActionChange = useCallback(
    (proposalAction: ProposalAction) => {
      setProposalAction(proposalAction)
    },
    [setProposalAction]
  )

  return (
    <AppBody {...appBodyProps}>
      <CreateProposalTabs />
      <Wrapper>
        <BlueCard>
          <AutoColumn gap="10px">
            <TYPE.link fontWeight={400} color={'primaryText1'}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat.
            </TYPE.link>
          </AutoColumn>
        </BlueCard>
        <ProposalWrapper>
          <ProposalActionPane>
            <ProposalActionSelector onClick={handleActionSelectorClick} proposalAction={proposalAction} />
            <ProposalActionDetail proposalAction={proposalAction} />
          </ProposalActionPane>
          <ProposalEditorPane>
            <ProposalEditor />
          </ProposalEditorPane>
        </ProposalWrapper>
        <CreateProposalButton>Create Proposal</CreateProposalButton>
      </Wrapper>
      <ProposalActionSelectorModal
        isOpen={modalOpen}
        onDismiss={handleDismissActionSelector}
        onProposalActionSelect={(proposalAction: ProposalAction) => handleActionChange(proposalAction)}
      />
    </AppBody>
  )
}
