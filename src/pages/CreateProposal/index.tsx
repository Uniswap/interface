import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import JSBI from 'jsbi'
import { utils } from 'ethers'
import { Button, TYPE } from 'theme'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import AppBody from '../AppBody'
import { generateBytesByType } from 'utils/generateBytesByType'
import { CreateProposalTabs } from '../../components/NavigationTabs'
import { ButtonError } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { BlueCard } from 'components/Card'
import { Wrapper } from 'pages/Pool/styleds'
import { ProposalAction, ProposalActionSelector, ProposalActionSelectorModal } from './ProposalActionSelector'
import { ProposalEditor } from './ProposalEditor'
import { ProposalActionDetail } from './ProposalActionDetail'
import { ProposalSubmissionModal } from './ProposalSubmissionModal'
import { useActiveWeb3React } from 'hooks/web3'
import {
  CreateProposalData,
  ProposalState,
  useCreateProposalCallback,
  useLatestProposalId,
  useProposalData,
  useUserVotes,
} from 'state/governance/hooks'

const ProposalWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
`

const CreateProposalButton = ({
  hasActiveOrPendingProposal,
  hasEnoughVote,
  disabledCreateProposalButton,
  handleCreateProposal,
}: {
  hasActiveOrPendingProposal: boolean
  hasEnoughVote: boolean
  disabledCreateProposalButton: boolean
  handleCreateProposal: () => void
}) => {
  return hasActiveOrPendingProposal ? (
    <ButtonError marginTop="18px">You already have an active or pending proposal</ButtonError>
  ) : hasEnoughVote ? (
    <Button style={{ marginTop: '18px' }} disabled={disabledCreateProposalButton} onClick={handleCreateProposal}>
      Create Proposal
    </Button>
  ) : (
    <ButtonError marginTop="18px">You don&apos;t have enough vote to create a proposal</ButtonError>
  )
}

export default function CreateProposal() {
  const { account, chainId } = useActiveWeb3React()

  const latestProposalId =
    useLatestProposalId(account ?? '0x0000000000000000000000000000000000000000')?.toString() ?? '0'
  const latestProposalData = useProposalData(latestProposalId)
  const availableVotes: CurrencyAmount<Token> | undefined = useUserVotes()

  const [modalOpen, setModalOpen] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [proposalAction, setProposalAction] = useState(ProposalAction.TRANSFER_TOKEN)
  const [toAddressValue, setToAddressValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState<Currency>()
  const [amountValue, setAmountValue] = useState('')
  const [titleValue, setTitleValue] = useState('')
  const [bodyValue, setBodyValue] = useState('')

  const handleActionSelectorClick = useCallback(() => [setModalOpen(true)], [setModalOpen])
  const handleActionChange = useCallback((proposalAction: ProposalAction) => [setProposalAction(proposalAction)], [
    setProposalAction,
  ])
  const handleDismissActionSelector = useCallback(() => [setModalOpen(false)], [setModalOpen])
  const handleDismissSubmissionModal = useCallback(() => [setHash(undefined), setAttempting(false)], [
    setHash,
    setAttempting,
  ])
  const handleToAddressInput = useCallback((toAddress: string) => [setToAddressValue(toAddress)], [setToAddressValue])
  const handleCurrencySelect = useCallback((currency: Currency) => [setCurrencyValue(currency)], [setCurrencyValue])
  const handleAmountInput = useCallback((amount: string) => [setAmountValue(amount)], [setAmountValue])
  const handleTitleInput = useCallback((title: string) => [setTitleValue(title)], [setTitleValue])
  const handleBodyInput = useCallback((body: string) => [setBodyValue(body)], [setBodyValue])

  const disabledCreateProposalButton = useMemo(
    () =>
      Boolean(
        !proposalAction ||
          !utils.isAddress(toAddressValue) ||
          !currencyValue?.isToken ||
          amountValue === '' ||
          titleValue === '' ||
          bodyValue === '' ||
          latestProposalData?.status === ProposalState.Active ||
          latestProposalData?.status === ProposalState.Pending
      ),
    [proposalAction, toAddressValue, currencyValue, amountValue, titleValue, bodyValue, latestProposalData]
  )
  const createProposalCallback = useCreateProposalCallback()

  const handleCreateProposal = async () => {
    setAttempting(true)

    if (!createProposalCallback) return

    const createProposalData: CreateProposalData = {} as CreateProposalData
    let calldataValues: string[] = []

    createProposalData.targets = currencyValue?.isToken ? [currencyValue.address] : []
    createProposalData.values = ['0']

    switch (proposalAction) {
      case ProposalAction.TRANSFER_TOKEN:
        createProposalData.signatures = ['transfer(address,uint256)']
        calldataValues = [toAddressValue, amountValue]
        break
      case ProposalAction.APPROVE_TOKEN:
        createProposalData.signatures = ['approve(address,uint256)']
        calldataValues = [toAddressValue, amountValue]
        break
      default:
        createProposalData.signatures = []
    }

    const typesArray = createProposalData.signatures[0].split('(').pop()?.split(')')[0]?.split(',')
    const bytes = typesArray?.map((type, i) => generateBytesByType(type, calldataValues[i]))

    createProposalData.calldatas = bytes !== undefined ? ['0x'.concat(...bytes)] : []
    createProposalData.description = `# ${titleValue}

${bodyValue}
`

    const hash = await createProposalCallback(createProposalData ?? undefined)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) setHash(hash)
  }

  return (
    <AppBody {...{ maxWidth: '1200px' }}>
      <CreateProposalTabs />
      <Wrapper>
        <BlueCard>
          <AutoColumn gap="10px">
            <TYPE.link fontWeight={400} color={'primaryText1'}>
              <strong>Tip:</strong> Enter the proposed action and a description to help the community understand your
              proposal. You will not be able to modify a proposal once submitted, so please check that all information
              is correct. The voting period will begin immediately and last for 7 days.
            </TYPE.link>
          </AutoColumn>
        </BlueCard>

        <ProposalWrapper>
          <div style={{ flex: '1 400px' }}>
            <ProposalActionSelector onClick={handleActionSelectorClick} proposalAction={proposalAction} />
            <ProposalActionDetail
              proposalAction={proposalAction}
              currency={currencyValue}
              amount={amountValue}
              toAddress={toAddressValue}
              onCurrencySelect={handleCurrencySelect}
              onAmountInput={handleAmountInput}
              onToAddressInput={handleToAddressInput}
            />
          </div>
          <div style={{ flex: '1 400px' }}>
            <ProposalEditor
              title={titleValue}
              body={bodyValue}
              onTitleInput={handleTitleInput}
              onBodyInput={handleBodyInput}
            />
          </div>
        </ProposalWrapper>
        <CreateProposalButton
          hasActiveOrPendingProposal={
            latestProposalData?.status === ProposalState.Active || latestProposalData?.status === ProposalState.Pending
          }
          hasEnoughVote={
            availableVotes ? JSBI.greaterThanOrEqual(availableVotes.quotient, JSBI.BigInt(10000000)) : false
          }
          disabledCreateProposalButton={disabledCreateProposalButton}
          handleCreateProposal={handleCreateProposal}
        />
      </Wrapper>
      <ProposalActionSelectorModal
        isOpen={modalOpen}
        onDismiss={handleDismissActionSelector}
        onProposalActionSelect={(proposalAction: ProposalAction) => handleActionChange(proposalAction)}
      />
      <ProposalSubmissionModal
        isOpen={attempting}
        hash={hash}
        chainId={chainId}
        onDismiss={handleDismissSubmissionModal}
      />
    </AppBody>
  )
}
