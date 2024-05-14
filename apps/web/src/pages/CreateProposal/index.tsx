import { Interface } from '@ethersproject/abi'
import { getAddress, isAddress } from '@ethersproject/address'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { ButtonError } from 'components/Button'
import { BlueCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import {
  AUTHORITY_ADDRESSES,
  GOVERNANCE_PROXY_ADDRESSES,
  RB_FACTORY_ADDRESSES,
  STAKING_PROXY_ADDRESSES,
} from 'constants/addresses'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { Wrapper } from 'pages/Pool/styled'
import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link } from 'react-router-dom'
import {
  CreateProposalData,
  useCreateProposalCallback,
  useProposalThreshold,
  useUserVotes,
} from 'state/governance/hooks'
import styled from 'styled-components'
import { ExternalLink, StyledInternalLink, ThemedText } from 'theme/components'
import AUTHORITY_ABI from 'uniswap/src/abis/authority.json'
import TOKEN_ABI from 'uniswap/src/abis/erc20.json'
import GOVERNANCE_RB_ABI from 'uniswap/src/abis/governance.json'
import RB_POOL_FACTORY_ABI from 'uniswap/src/abis/rb-pool-factory.json'
import STAKING_PROXY_ABI from 'uniswap/src/abis/staking-proxy.json'

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
            <Trans>You must have {{ formattedProposalThreshold }} votes to submit a proposal</Trans>
          ) : (
            <Trans>You don&apos;t have enough votes to submit a proposal</Trans>
          )}
        </>
      ) : (
        <Trans>Create proposal</Trans>
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
          titleValue === '' ||
          bodyValue === ''
      ),
    [proposalAction, toAddressValue, currencyValue, titleValue, bodyValue]
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

    createProposalData.description = `# ${titleValue}

${bodyValue}
`

    let values: (string | boolean)[][]
    let methods: string[]
    let targets: string[]
    let interfaces: Interface[]
    // TODO: add all governance owned methods
    switch (proposalAction) {
      case ProposalAction.TRANSFER_TOKEN: {
        if (!tokenAmount) return
        values = [[getAddress(toAddressValue), tokenAmount.quotient.toString()]]
        interfaces = [new Interface(TOKEN_ABI)]
        targets = [currencyValue.address]
        methods = ['transfer']
        break
      }

      case ProposalAction.APPROVE_TOKEN: {
        if (!tokenAmount) return
        values = [[getAddress(toAddressValue), tokenAmount.quotient.toString()]]
        interfaces = [new Interface(TOKEN_ABI)]
        targets = [currencyValue.address]
        methods = ['approve']
        break
      }

      case ProposalAction.UPGRADE_IMPLEMENTATION: {
        values = [[getAddress(toAddressValue)]]
        interfaces = [new Interface(RB_POOL_FACTORY_ABI)]
        targets = [RB_FACTORY_ADDRESSES[chainId ?? 1]]
        methods = ['setImplementation']
        break
      }

      case ProposalAction.UPGRADE_GOVERNANCE: {
        values = [[getAddress(toAddressValue)]]
        interfaces = [new Interface(GOVERNANCE_RB_ABI)]
        targets = [GOVERNANCE_PROXY_ADDRESSES[chainId ?? 1]]
        methods = ['upgradeImplementation']
        break
      }

      case ProposalAction.UPGRADE_STAKING: {
        values = [
          [STAKING_PROXY_ADDRESSES[chainId ?? 1]],
          [],
          [getAddress(toAddressValue)],
          [STAKING_PROXY_ADDRESSES[chainId ?? 1]],
        ]
        interfaces = [new Interface(STAKING_PROXY_ABI)]
        targets = [STAKING_PROXY_ADDRESSES[chainId ?? 1]]
        methods = ['addAuthorizedAddress', 'detachStakingContract', 'attachStakingContract', 'removeAuthorizedAddress']
        break
      }

      // any non-empty string for the boolean value will result in adding an adapter
      case ProposalAction.ADD_ADAPTER: {
        values = [[getAddress(toAddressValue), true]]
        interfaces = [new Interface(AUTHORITY_ABI)]
        targets = [AUTHORITY_ADDRESSES[chainId ?? 1]]
        methods = ['setAdapter']
        break
      }

      // an empty string for the boolean value will result in removing an adapter
      case ProposalAction.REMOVE_ADAPTER: {
        values = [[getAddress(toAddressValue), false]]
        interfaces = [new Interface(AUTHORITY_ABI)]
        targets = [AUTHORITY_ADDRESSES[chainId ?? 1]]
        methods = ['setAdapter']
        break
      }
    }

    createProposalData.actions = []
    for (let i = 0; i < values.length; i++) {
      createProposalData.actions[i] = {
        target: targets[0],
        value: '0',
        data: interfaces[0].encodeFunctionData(methods[i], values[i]),
      }
    }

    const hash = await createProposalCallback(createProposalData ?? undefined)?.catch(() => {
      setAttempting(false)
    })

    if (hash) setHash(hash)
  }

  return (
    <Trace page={InterfacePageName.VOTE_PAGE} shouldLogImpression>
      <PageWrapper>
        <AppBody $maxWidth="800px">
          <Nav to="/vote">
            <BackArrow />
            <HeaderText>Create Proposal</HeaderText>
          </Nav>
          <CreateProposalWrapper>
            <BlueCard>
              <AutoColumn gap="10px">
                <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
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
                Don’t have enough votes? Earn GRG tokens by{' '}
                <StyledInternalLink to="/mint">operating a pool</StyledInternalLink>
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
