import React, { useCallback, useMemo, useState } from 'react'
import JSBI from 'jsbi'
import styled from 'styled-components/macro'
import { utils } from 'ethers'
import { ExternalLink, TYPE } from 'theme'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNI } from '../../constants/tokens'
import AppBody from '../AppBody'
import { CreateProposalTabs } from '../../components/NavigationTabs'
import { ButtonError } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { BlueCard } from 'components/Card'
import { Wrapper } from 'pages/Pool/styleds'
import { ProposalAction, ProposalActionSelector, ProposalActionSelectorModal, ProposalChoices } from './ProposalActionSelector'
import { ProposalEditor } from './ProposalEditor'
import { ProposalActionDetail } from './ProposalActionDetail'
import { ProposalSubmissionModal } from './ProposalSubmissionModal'
import { useActiveWeb3React } from 'hooks/web3'
import snapshot from '@snapshot-labs/snapshot.js';
import moment from 'moment'
import {
  CreateProposalData,
  ProposalState,
  useCreateProposalCallback,
  useLatestProposalId,
  useProposalData,
  useProposalThreshold,
  useUserVotes,
} from 'state/governance/hooks'
import { Trans } from '@lingui/macro'
import { tryParseAmount } from 'state/swap/hooks'
import { getAddress } from '@ethersproject/address'
import { Web3Provider } from '@ethersproject/providers';
import { useBlockNumber } from 'state/application/hooks'
import { getBlockFromTimestamp } from 'state/logs/utils'
import useTheme from 'hooks/useTheme'


const CreateProposalButton = ({
  proposalThreshold,
  hasActiveOrPendingProposal,
  hasEnoughVote,
  isFormInvalid,
  handleCreateProposal,
}: {
  proposalThreshold?: CurrencyAmount<Token>
  hasActiveOrPendingProposal: boolean
  hasEnoughVote: boolean
  isFormInvalid: boolean
  handleCreateProposal: () => void
}) => {
  const formattedProposalThreshold = proposalThreshold
    ? JSBI.divide(
        proposalThreshold.quotient,
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(proposalThreshold.currency.decimals))
      ).toLocaleString()
    : undefined

  return (
    <ButtonError
      style={{ marginTop: '18px' }}
      error={hasActiveOrPendingProposal || !hasEnoughVote}
      disabled={isFormInvalid || hasActiveOrPendingProposal || !hasEnoughVote}
      onClick={handleCreateProposal}
    >
      {hasActiveOrPendingProposal ? (
        <Trans>You already have an active or pending proposal</Trans>
      ) : !hasEnoughVote ? (
        <>
          {formattedProposalThreshold ? (
            <Trans>You must have {formattedProposalThreshold} votes to submit a proposal</Trans>
          ) : (
            <Trans>You don&apos;t have enough votes to submit a proposal</Trans>
          )}
        </>
      ) : (
        <Trans>Create Proposal</Trans>
      )}
    </ButtonError>
  )
}

const CreateProposalWrapper = styled(Wrapper)`
  display: flex;
  flex-flow: column wrap;
`

const AutonomousProposalCTA = styled.div`
  text-align: center;
  margin-top: 10px;
`



export default function CreateProposal() {
  const { account, chainId, library } = useActiveWeb3React()
  const web3 = new Web3Provider(library?.provider as any);
  const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
  const client = new snapshot.Client712(hub);
  const latestProposalId = useLatestProposalId(account ?? undefined) ?? '0'
  const latestProposalData = useProposalData(0, latestProposalId)
  const { votes: availableVotes } = useUserVotes()
  const proposalThreshold: CurrencyAmount<Token> | undefined = useProposalThreshold()

  const [modalOpen, setModalOpen] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [proposalAction, setProposalAction] = useState(ProposalAction.TRANSFER_TOKEN)
  const [toAddressValue, setToAddressValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState<Currency>(UNI[chainId ?? 1])
  const [amountValue, setAmountValue] = useState('')
  const [titleValue, setTitleValue] = useState('')
  const [bodyValue, setBodyValue] = useState('')

  const handleActionSelectorClick = useCallback(() => {
    setModalOpen(true)
  }, [setModalOpen])

  const handleActionChange = useCallback(
    (proposalAction: ProposalAction) => {
      setProposalAction(proposalAction)
    },
    [setProposalAction]
  )

  const handleDismissActionSelector = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const handleDismissSubmissionModal = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
  }, [setHash, setAttempting])

  const handleToAddressInput = useCallback(
    (toAddress: string) => {
      setToAddressValue(toAddress)
    },
    [setToAddressValue]
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      setCurrencyValue(currency)
    },
    [setCurrencyValue]
  )

  const handleAmountInput = useCallback(
    (amount: string) => {
      setAmountValue(amount)
    },
    [setAmountValue]
  )

  const handleTitleInput = useCallback(
    (title: string) => {
      setTitleValue(title)
    },
    [setTitleValue]
  )

  const handleBodyInput = useCallback(
    (body: string) => {
      setBodyValue(body)
    },
    [setBodyValue]
  )
    const lastblock = useBlockNumber()
  const isFormInvalid = useMemo(
    () =>
      Boolean(
        !proposalAction ||
          !utils.isAddress(toAddressValue) ||
          !currencyValue?.isToken ||
          amountValue === '' ||
          titleValue === '' ||
          bodyValue === ''
      ),
    [proposalAction, toAddressValue, currencyValue, amountValue, titleValue, bodyValue]
  )

  const hasEnoughVote = Boolean(
    availableVotes && proposalThreshold && JSBI.greaterThanOrEqual(availableVotes.quotient, proposalThreshold.quotient)
  )

  const createProposalCallback = useCreateProposalCallback()


  const [choices, setChoices] = React.useState<string[]>(['Yes', 'No'])
  const handleCreateProposal = async () => {
    setAttempting(true)

    const createProposalData: CreateProposalData = {} as CreateProposalData

    if (!createProposalCallback || !proposalAction) return


    createProposalData.values = ['0']
    createProposalData.description = `# ${titleValue}

${bodyValue}
`

    let types: string[][]
    let values: string[][]
    
    createProposalData.calldatas = []
 
    if (account) {
      const start = lastblock as number;
      const end = await getBlockFromTimestamp(moment(new Date()).add('days', 7).unix())
   
    const hash =  await client.proposal(web3 as any, account, {
      space: 'kibaworldwide.eth',
      type: 'single-choice',
      title: titleValue,
      body: bodyValue,
      choices,
      start: lastblock as number,
      end: end,
      snapshot: lastblock as number,
      network: '1',
      strategies: JSON.stringify([]),
      plugins: JSON.stringify({}),
      metadata: JSON.stringify({ app: 'snapshot.js' })
    })
  ?.catch(() => {
      setAttempting(false)
    })

    if (hash) setHash(hash as any)
  }
}
const theme = useTheme()

  return (
    <AppBody {...{ maxWidth: '800px' }}>
      {/* <CreateProposalTabs />
      <CreateProposalWrapper>
        <BlueCard>
          <AutoColumn gap="10px">
            <TYPE.link fontWeight={400} color={'primaryText1'}>
              <Trans>
                <strong>Tip:</strong> Include as much detail as possible in your proposal. The proposal cannot
                be modified after submission, so please verify all information before submitting. The voting period will
                begin immediately and last for 7 days. 
                <ExternalLink href="https://snapshot.org/#/kibaworldwide.eth">
                  view snapshot.org
                </ExternalLink>
                .
              </Trans>
            </TYPE.link>
          </AutoColumn>
        </BlueCard>

        <ProposalActionDetail
          proposalAction={proposalAction}
          currency={currencyValue}
          amount={amountValue}
          toAddress={toAddressValue}
          onCurrencySelect={handleCurrencySelect}
          onAmountInput={handleAmountInput}
          onToAddressInput={handleToAddressInput}
        />
        {/* <ProposalChoices choices={choices} setChoices={setChoices} /> 
        <ProposalEditor
          title={titleValue}
          body={bodyValue}
          onTitleInput={handleTitleInput}
          onBodyInput={handleBodyInput}
        />
        <CreateProposalButton
          proposalThreshold={proposalThreshold}
          hasActiveOrPendingProposal={
            latestProposalData?.status === ProposalState.ACTIVE || latestProposalData?.status === ProposalState.PENDING
          }
          hasEnoughVote={true}
          isFormInvalid={false}
          handleCreateProposal={handleCreateProposal}
        />
        {!hasEnoughVote ? (
          <AutonomousProposalCTA>
            Don’t have 2.5M votes? Anyone can create an autonomous proposal using{' '}
            <ExternalLink href="https://fish.vote">fish.vote</ExternalLink>
          </AutonomousProposalCTA>
        ) : null}
      </CreateProposalWrapper>
      <ProposalActionSelectorModal
        isOpen={modalOpen}
        onDismiss={handleDismissActionSelector}
        onProposalActionSelect={(proposalAction: ProposalAction) => handleActionChange(proposalAction)}
      />
      <ProposalSubmissionModal isOpen={attempting} hash={hash} onDismiss={handleDismissSubmissionModal} />
  */}  
  <iframe src={'https://snapshot.org/#/kibaworldwide.eth'} style={{width:'100%', height:'100vh', background:'transparent', border: `1px solid ${theme.primary1}`}} />
   </AppBody>
  )
}
