import { defaultAbiCoder, Interface } from '@ethersproject/abi'
import { getAddress, isAddress } from '@ethersproject/address'
import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import GOVERNANCE_RB_ABI from 'abis/governance.json'
import RB_POOL_FACTORY_ABI from 'abis/rb-pool-factory.json'
import { ButtonError } from 'components/Button'
import { BlueCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { GOVERNANCE_PROXY_ADDRESSES, RB_FACTORY_ADDRESSES } from 'constants/addresses'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { Wrapper } from 'pages/Pool/styleds'
import { useCallback, useMemo, useState } from 'react'
import {
  CreateProposalData,
  useCreateProposalCallback,
  useProposalThreshold,
  useUserVotes,
} from 'state/governance/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'

import { CreateProposalTabs } from '../../components/NavigationTabs'
import { GRG } from '../../constants/tokens'
import AppBody from '../AppBody'
import { ProposalActionDetail } from './ProposalActionDetail'
import { ProposalAction, ProposalActionSelector, ProposalActionSelectorModal } from './ProposalActionSelector'
import { ProposalEditor } from './ProposalEditor'
import { ProposalSubmissionModal } from './ProposalSubmissionModal'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
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
  const { chainId } = useWeb3React()

  const { votes: availableVotes } = useUserVotes()
  const proposalThreshold: CurrencyAmount<Token> | undefined = useProposalThreshold()

  const [modalOpen, setModalOpen] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [proposalAction, setProposalAction] = useState(ProposalAction.UPGRADE_IMPLEMENTATION)
  const [toAddressValue, setToAddressValue] = useState('')
  // TODO: check we are covering all chains
  const [currencyValue, setCurrencyValue] = useState<Currency>(GRG[chainId ?? 1])
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

  const isFormInvalid = useMemo(
    () =>
      Boolean(
        !proposalAction ||
          !isAddress(toAddressValue) ||
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

  const handleCreateProposal = async () => {
    setAttempting(true)

    const createProposalData: CreateProposalData = {} as CreateProposalData

    if (!createProposalCallback || !proposalAction || !currencyValue.isToken) return

    const tokenAmount = tryParseCurrencyAmount(amountValue, currencyValue)
    if (!tokenAmount) return

    createProposalData.actions[0].target = currencyValue.address
    createProposalData.actions[0].value = '0'
    createProposalData.description = `# ${titleValue}

${bodyValue}
`

    let types: string[][]
    let values: string[][]
    // TODO: add all governance owned methods
    switch (proposalAction) {
      case ProposalAction.TRANSFER_TOKEN: {
        types = [['address', 'uint256']]
        values = [[getAddress(toAddressValue), tokenAmount.quotient.toString()]]
        //createProposalData.signatures = [`transfer(${types[0].join(',')})`]
        break
      }

      case ProposalAction.APPROVE_TOKEN: {
        types = [['address', 'uint256']]
        values = [[getAddress(toAddressValue), tokenAmount.quotient.toString()]]
        //createProposalData.signatures = [`approve(${types[0].join(',')})`]
        break
      }

      case ProposalAction.UPGRADE_IMPLEMENTATION: {
        types = [['address']]
        values = [[getAddress(toAddressValue)]]
        //createProposalData.signatures = [`approve(${types[0].join(',')})`]
        break
      }

      case ProposalAction.UPGRADE_GOVERNANCE: {
        types = [['address']]
        values = [[getAddress(toAddressValue)]]
        //createProposalData.signatures = [`approve(${types[0].join(',')})`]
        break
      }
    }

    createProposalData.actions = []
    //let ContractInterface: Interface
    for (let i = 0; i < createProposalData.actions.length; i++) {
      if (ProposalAction.UPGRADE_GOVERNANCE) {
        const ContractInterface = new Interface(GOVERNANCE_RB_ABI)
        // TODO: check if we want to write createProposalData.actions[i] = new ProposedAction({...})
        createProposalData.actions[i].data = ContractInterface.encodeFunctionData('upgradeImplementation', [values[i]])
        // TODO: check we are covering all chains
        createProposalData.actions[i].target = GOVERNANCE_PROXY_ADDRESSES[chainId ?? 1]
        createProposalData.actions[i].value = '0'
      } else if (ProposalAction.UPGRADE_IMPLEMENTATION) {
        const ContractInterface = new Interface(RB_POOL_FACTORY_ABI)
        // TODO: check if we want to write createProposalData.actions[i] = new ProposedAction({...})
        createProposalData.actions[i].data = ContractInterface.encodeFunctionData('upgradeImplementation', [values[i]])
        createProposalData.actions[i].target = RB_FACTORY_ADDRESSES[chainId ?? 1]
        createProposalData.actions[i].value = '0'
      } else {
        createProposalData.actions[i].data = defaultAbiCoder.encode(types[i], values[i])
      }
    }

    const hash = await createProposalCallback(createProposalData ?? undefined)?.catch(() => {
      setAttempting(false)
    })

    if (hash) setHash(hash)
  }

  return (
    <Trace page={PageName.VOTE_PAGE} shouldLogImpression>
      <PageWrapper>
        <AppBody {...{ maxWidth: '800px' }}>
          <CreateProposalTabs />
          <CreateProposalWrapper>
            <BlueCard>
              <AutoColumn gap="10px">
                <ThemedText.DeprecatedLink fontWeight={400} color="deprecated_primaryText1">
                  <Trans>
                    <strong>Tip:</strong> Select an action and describe your proposal for the community. The proposal
                    cannot be modified after submission, so please verify all information before submitting. The voting
                    period will begin after the new epoch starts and last for 7 days. To propose a custom action,{' '}
                    <ExternalLink href="https://docs.rigoblock.com/readme-1/governance/solidity-api#propose">
                      read the docs
                    </ExternalLink>
                    .
                  </Trans>
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
              hasActiveOrPendingProposal={false}
              hasEnoughVote={hasEnoughVote}
              isFormInvalid={isFormInvalid}
              handleCreateProposal={handleCreateProposal}
            />
            {!hasEnoughVote ? (
              <AutonomousProposalCTA>
                Don’t have enough votes? Earn GRG rewards by{' '}
                <ExternalLink href="https://app.rigoblock.com/#/swap">operating a pool</ExternalLink>
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
