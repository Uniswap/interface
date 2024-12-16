/* eslint-disable @typescript-eslint/no-unused-vars */

import { InterfacePageName } from '@ubeswap/analytics-events'
import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { Trace } from 'analytics'
import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonError } from 'components/Button'
import { BlueCard } from 'components/Card'
import Column, { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import TextInputPanel from 'components/TextInputPanel'
import { useToken } from 'hooks/Tokens'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import { Wrapper } from 'pages/Pool/styled'
import { useCallback, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link } from 'react-router-dom'
import { CreateProposalData, useCreateProposalCallback } from 'state/governance/hooks'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'

import AppBody from '../AppBody'
import { Action, ActionSelector } from './ActionSelector'

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
  //const { account, chainId } = useWeb3React()

  const proposalThreshold: CurrencyAmount<Token> | undefined = undefined

  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const [tokenAddress, setTokenAddress] = useState('')
  const token = useToken(tokenAddress)
  const [logoUrl, setLogoUrl] = useState('')

  const actions: Action[] = [
    {
      id: '1',
      name: 'Deneme 1',
    },
    {
      id: '2',
      name: 'Deneme 2',
    },
    {
      id: '3',
      name: 'Deneme 3 adsas',
    },
  ]
  const [selectedAction, setSelectedAction] = useState('1')

  const handleActionChange = useCallback(
    (action: string) => {
      setSelectedAction(action)
    },
    [setSelectedAction]
  )

  const handleDismissSubmissionModal = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
  }, [setHash, setAttempting])

  const isFormInvalid = true
  const hasEnoughVote = true

  const createProposalCallback = useCreateProposalCallback()

  const handleCreateProposal = async () => {
    setAttempting(true)

    const createProposalData: CreateProposalData = {} as CreateProposalData

    // const tokenAmount = tryParseCurrencyAmount(amountValue, currencyValue)
    // if (!tokenAmount) return

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
                    period will begin immediately and last for 7 days. To propose a custom action,{' '}
                    <ExternalLink href="https://docs.uniswap.org/protocol/reference/Governance/governance-reference#propose">
                      read the docs
                    </ExternalLink>
                    .
                  </Trans>
                </ThemedText.DeprecatedLink>
              </AutoColumn>
            </BlueCard>

            <div style={{ marginTop: '16px' }}></div>

            <AddressInputPanel
              label="Token Address"
              placeholder="Token Contact Address"
              value={tokenAddress}
              onChange={setTokenAddress}
            />

            <ThemedText.SubHeaderSmall style={{ padding: '2px 0 12px 16px' }}>
              {token ? `Name: ${token.name} \u00A0\u00A0\u00A0\u00A0 Symbol: ${token.symbol}` : 'Invalid token adress'}
            </ThemedText.SubHeaderSmall>

            <Row gap="10px">
              <Column flex="1">
                <TextInputPanel
                  label="Token Logo"
                  placeholder="Token logo url must be 200x200 png image link."
                  value={logoUrl}
                  onChange={setLogoUrl}
                />
              </Column>
              <div style={{ width: '85px', height: '85px', background: '#888888' }}></div>
            </Row>

            <ActionSelector
              title="Seç bir Aksiyon"
              items={actions}
              selectedAction={selectedAction}
              onActionSelect={handleActionChange}
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
                Don’t have 2.5M votes? Anyone can create an autonomous proposal using{' '}
                <ExternalLink href="https://fish.vote">fish.vote</ExternalLink>
              </AutonomousProposalCTA>
            ) : null}
          </CreateProposalWrapper>
        </AppBody>
      </PageWrapper>
    </Trace>
  )
}
