import { defaultAbiCoder } from '@ethersproject/abi'
import { getAddress, isAddress } from '@ethersproject/address'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { ButtonError } from 'components/Button'
import { BlueCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { LATEST_GOVERNOR_INDEX } from 'constants/governance'
import { UNI } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import styled from 'lib/styled-components'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import AppBody from 'pages/App/AppBody'
import { ProposalActionDetail } from 'pages/CreateProposal/ProposalActionDetail'
import {
  ProposalAction,
  ProposalActionSelector,
  ProposalActionSelectorModal,
} from 'pages/CreateProposal/ProposalActionSelector'
import { ProposalEditor } from 'pages/CreateProposal/ProposalEditor'
import { ProposalSubmissionModal } from 'pages/CreateProposal/ProposalSubmissionModal'
import { Wrapper } from 'pages/Pool/styled'
import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link } from 'react-router-dom'
import {
  CreateProposalData,
  ProposalState,
  useCreateProposalCallback,
  useLatestProposalId,
  useProposalData,
  useProposalThreshold,
  useUserVotes,
} from 'state/governance/hooks'
import { ExternalLink, ThemedText } from 'theme/components'
import Trace from 'uniswap/src/features/telemetry/Trace'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const BackArrow = styled(ArrowLeft)`
  cursor: pointer;
  color: ${({ theme }) => theme.neutral1};
`
const Nav = styled(Link)`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  margin: 1em 0 0 1em;
  text-decoration: none;
`

const HeaderText = styled(ThemedText.H1Small)`
  margin: auto !important;
`

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
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(proposalThreshold.currency.decimals)),
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
        <Trans i18nKey="vote.proposal.activeOrPendingProposal" />
      ) : !hasEnoughVote ? (
        <>
          {formattedProposalThreshold ? (
            <Trans
              i18nKey="vote.proposal.voteThreshold"
              values={{
                formattedProposalThreshold,
              }}
            />
          ) : (
            <Trans i18nKey="vote.proposal.notEnoughVotes" />
          )}
        </>
      ) : (
        <Trans i18nKey="vote.landing.createProposal" />
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
  const account = useAccount()

  const latestProposalId = useLatestProposalId(account.address) ?? '0'
  const latestProposalData = useProposalData(LATEST_GOVERNOR_INDEX, latestProposalId)
  const { votes: availableVotes } = useUserVotes()
  const proposalThreshold: CurrencyAmount<Token> | undefined = useProposalThreshold()

  const [modalOpen, setModalOpen] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [proposalAction, setProposalAction] = useState(ProposalAction.TRANSFER_TOKEN)
  const [toAddressValue, setToAddressValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState<Currency>(UNI[account.chainId ?? 1])
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
    [setProposalAction],
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
    [setToAddressValue],
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      setCurrencyValue(currency)
    },
    [setCurrencyValue],
  )

  const handleAmountInput = useCallback(
    (amount: string) => {
      setAmountValue(amount)
    },
    [setAmountValue],
  )

  const handleTitleInput = useCallback(
    (title: string) => {
      setTitleValue(title)
    },
    [setTitleValue],
  )

  const handleBodyInput = useCallback(
    (body: string) => {
      setBodyValue(body)
    },
    [setBodyValue],
  )

  const isFormInvalid = useMemo(
    () =>
      Boolean(
        !proposalAction ||
          !isAddress(toAddressValue) ||
          !currencyValue?.isToken ||
          amountValue === '' ||
          titleValue === '' ||
          bodyValue === '',
      ),
    [proposalAction, toAddressValue, currencyValue, amountValue, titleValue, bodyValue],
  )

  const hasEnoughVote = Boolean(
    availableVotes && proposalThreshold && JSBI.greaterThanOrEqual(availableVotes.quotient, proposalThreshold.quotient),
  )

  const createProposalCallback = useCreateProposalCallback()

  const handleCreateProposal = async () => {
    setAttempting(true)

    const createProposalData: CreateProposalData = {} as CreateProposalData

    if (!createProposalCallback || !proposalAction || !currencyValue.isToken) {
      return
    }

    const tokenAmount = tryParseCurrencyAmount(amountValue, currencyValue)
    if (!tokenAmount) {
      return
    }

    createProposalData.targets = [currencyValue.address]
    createProposalData.values = ['0']
    createProposalData.description = `# ${titleValue}

${bodyValue}
`

    let types: string[][]
    let values: string[][]
    switch (proposalAction) {
      case ProposalAction.TRANSFER_TOKEN: {
        types = [['address', 'uint256']]
        values = [[getAddress(toAddressValue), tokenAmount.quotient.toString()]]
        createProposalData.signatures = [`transfer(${types[0].join(',')})`]
        break
      }

      case ProposalAction.APPROVE_TOKEN: {
        types = [['address', 'uint256']]
        values = [[getAddress(toAddressValue), tokenAmount.quotient.toString()]]
        createProposalData.signatures = [`approve(${types[0].join(',')})`]
        break
      }
    }

    createProposalData.calldatas = []
    for (let i = 0; i < createProposalData.signatures.length; i++) {
      createProposalData.calldatas[i] = defaultAbiCoder.encode(types[i], values[i])
    }

    const hash = await createProposalCallback(createProposalData ?? undefined)?.catch(() => {
      setAttempting(false)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Trace logImpression page={InterfacePageName.VOTE_PAGE}>
      <PageWrapper>
        <AppBody $maxWidth="800px">
          <Nav to="/vote">
            <BackArrow />
            <HeaderText>
              <Trans i18nKey="vote.landing.createProposal" />
            </HeaderText>
          </Nav>
          <CreateProposalWrapper>
            <BlueCard>
              <AutoColumn gap="10px">
                <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
                  <Trans i18nKey="vote.create.prompt" />
                  <ExternalLink
                    key="create-proposal-prompt-link"
                    href="https://docs.uniswap.org/protocol/reference/Governance/governance-reference#propose"
                  >
                    <Trans i18nKey="proposal.readTheDocs" />
                  </ExternalLink>
                </ThemedText.DeprecatedLink>
              </AutoColumn>
            </BlueCard>

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
            <ProposalEditor
              title={titleValue}
              body={bodyValue}
              onTitleInput={handleTitleInput}
              onBodyInput={handleBodyInput}
            />
            <CreateProposalButton
              proposalThreshold={proposalThreshold}
              hasActiveOrPendingProposal={
                latestProposalData?.status === ProposalState.ACTIVE ||
                latestProposalData?.status === ProposalState.PENDING
              }
              hasEnoughVote={hasEnoughVote}
              isFormInvalid={isFormInvalid}
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
        </AppBody>
      </PageWrapper>
    </Trace>
  )
}
