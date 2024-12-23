/* eslint-disable @typescript-eslint/no-unused-vars */

import { InterfacePageName } from '@ubeswap/analytics-events'
import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { Trace } from 'analytics'
import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonError, ButtonPrimary } from 'components/Button'
import { BlueCard } from 'components/Card'
import Column, { AutoColumn } from 'components/Column'
import NumericalInputPanel from 'components/NumericalInputPanel'
import Row from 'components/Row'
import TextInputPanel from 'components/TextInputPanel'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { useToken } from 'hooks/Tokens'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import { useCallback, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link } from 'react-router-dom'
import { CreateProposalData, useCreateProposalCallback } from 'state/governance/hooks'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import AddTeamMemberModal from './AddTeamMemberModal'
import AddTokenomicsModal from './AddTokenomicsModal'
import SimpleTable from './SimpleTable'
import TextareaPanel from './TextareaPanel'

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

const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
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

export const SmallButtonPrimary = styled(ButtonPrimary)`
  width: auto;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;
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

const CreateProposalWrapper = styled.div`
  padding: 20px;
  display: flex;
  flex-flow: column wrap;
`

const AutonomousProposalCTA = styled.div`
  text-align: center;
  margin-top: 10px;
`

const Divider = styled.div`
  border-bottom: ${({ theme }) => `1px solid ${theme.surface3}`};
  width: 100%;
  margin: 20px 0;
`

interface TokenomicsTableValues {
  index: number
  name: string
  amount: number
  unlockedAmount: number
  cliff: number
  vesting: number
}
interface TeamTableValues {
  index: number
  name: string
  position: string
  imgUrl: string
  linkedin: string
  twitter: string
}

export default function CreateLaunchpad() {
  //const { account, chainId } = useWeb3React()

  const proposalThreshold: CurrencyAmount<Token> | undefined = undefined

  const theme = useTheme()

  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const [tokenAddress, setTokenAddress] = useState('')
  const token = useToken(tokenAddress)
  const [logoUrl, setLogoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [auditLinks, setAuditLinks] = useState('')
  const [website, setWebsite] = useState('')

  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [discord, setDiscord] = useState('')
  const [medium, setMedium] = useState('')
  const [youtube, setYoutube] = useState('')
  const [farcaster, setFarcaster] = useState('')

  // ----- tokenomics -----
  const [tokenomics, setTokenomics] = useState<TokenomicsTableValues[]>([])
  const [tokenomicsModalOpened, setTokenomicsModalOpened] = useState(false)
  const tokenomicsHeaders = ['#', 'Type', 'Amount', 'Unlocked at TGE', 'Cliff', 'Vesting']
  const tokenomicsData = tokenomics.map((info) => [
    info.index.toString(),
    info.name,
    info.amount.toString(),
    info.unlockedAmount.toString(),
    info.cliff.toString(),
    info.vesting.toString(),
  ])
  const onAddTokenomics = () => {
    setTokenomicsModalOpened(true)
  }
  const addTokenomics = (tokenomicsInfo: TokenomicsTableValues) => {
    setTokenomics((oldVal) => {
      const newArray = [...oldVal, tokenomicsInfo]
      newArray.forEach((item, i) => {
        item.index = i + 1
      })
      return newArray
    })
    setTokenomicsModalOpened(false)
  }
  // ------

  // ------ Team -------
  const [teamMembers, setTeamMembers] = useState<TeamTableValues[]>([])
  const teamColumnHeaders = ['#', 'Image', 'Name', 'Position']
  //const teamMembersData = teamMembers.map((t) => [t.index.toString(), t.name, t.position])
  const teamMembersData = teamMembers.map((teamMember) => [
    teamMember.index.toString(),
    <img key={`teamimg-${teamMember.index}`} src={teamMember.imgUrl} style={{ maxWidth: '50px', maxHeight: '30px' }} />,
    teamMember.name,
    teamMember.position,
  ])
  const [teamModalOpened, setTeamModalOpened] = useState(false)
  const onAddTeamMember = () => {
    setTeamModalOpened(true)
  }
  const addTeamMember = (tokenomicsInfo: TeamTableValues) => {
    setTeamMembers((oldVal) => {
      const newArray = [...oldVal, tokenomicsInfo]
      newArray.forEach((item, i) => {
        item.index = i + 1
      })
      return newArray
    })
    setTeamModalOpened(false)
  }
  // ------

  // CELO / UBE / USDT / USDC / cUSD / GLOUSD
  const quoteTokens: Action[] = [
    {
      id: 'CELO',
      name: 'CELO',
    },
    {
      id: 'UBE',
      name: 'UBE',
    },
    {
      id: 'USDT',
      name: 'USDT',
    },
    {
      id: 'USDC',
      name: 'USDC',
    },
    {
      id: 'cUSD',
      name: 'cUSD',
    },
    {
      id: 'GLOUSD',
      name: 'GLOUSD',
    },
  ]
  const [selectedQuoteToken, setSelectedQuoteToken] = useState('UBE')

  const [sellAmount, setSellAmount] = useState('')
  const [softCap, setSoftCap] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [listingPrice, setListingPrice] = useState('')
  const [startDate, setStartDate] = useState('')
  const [duration, setDuration] = useState('')
  const [unlockedTge, setUnlockedTge] = useState('')
  const [vestingDuration, setVestingDuration] = useState('')

  const liqActions: Action[] = [
    {
      id: 'BURN',
      name: 'Burned',
    },
    {
      id: 'LOCK',
      name: 'Locked',
    },
  ]
  const [selectedLiqAction, setSelectedLiqAction] = useState('BURN')
  const [liquidityPercentage, setLiquidityPercentage] = useState('50')
  const [lockPeriod, setLockPeriod] = useState('')

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
            <HeaderText>Create Launchpad</HeaderText>
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

            <Row gap="10px" marginBottom="12px">
              <Column flex="1">
                <TextInputPanel
                  label="Token Logo"
                  placeholder="Token logo url must be 200x200 png image link."
                  value={logoUrl}
                  onChange={setLogoUrl}
                />
              </Column>
              {logoUrl && (
                <div style={{ width: '85px', height: '85px' }}>
                  <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%' }} />
                </div>
              )}
            </Row>

            <Row marginBottom="12px">
              <TextareaPanel
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Project info"
                fontSize="1rem"
                minHeight="100px"
              />
            </Row>

            <Row marginBottom="12px">
              <TextareaPanel
                label="Audit Links"
                value={auditLinks}
                onChange={setAuditLinks}
                placeholder="Audit links line by line"
                fontSize="1rem"
                minHeight="50px"
              />
            </Row>

            <Row marginBottom="12px">
              <TextInputPanel
                label="Project Website"
                placeholder="Website link"
                value={website}
                onChange={setWebsite}
              />
            </Row>

            <Row gap="10px" marginBottom="12px">
              <Column flex="1">
                <TextInputPanel
                  label="Twitter/X"
                  placeholder="Twitter page link"
                  value={twitter}
                  onChange={setTwitter}
                />
              </Column>
              <Column flex="1">
                <TextInputPanel
                  label="Telegram"
                  placeholder="Telegram group link"
                  value={telegram}
                  onChange={setTelegram}
                />
              </Column>
            </Row>
            <Row gap="10px" marginBottom="12px">
              <Column flex="1">
                <TextInputPanel label="Discord" placeholder="Discord link" value={discord} onChange={setDiscord} />
              </Column>
              <Column flex="1">
                <TextInputPanel label="Medium" placeholder="Medium link" value={medium} onChange={setMedium} />
              </Column>
            </Row>
            <Row gap="10px" marginBottom="12px">
              <Column flex="1">
                <TextInputPanel label="Youtube" placeholder="Youtube link" value={youtube} onChange={setYoutube} />
              </Column>
              <Column flex="1">
                <TextInputPanel
                  label="Farcaster"
                  placeholder="Farcaster link"
                  value={farcaster}
                  onChange={setFarcaster}
                />
              </Column>
            </Row>

            <Row marginBottom="8px" marginTop="12px" marginLeft="4px">
              <Column flex="1">
                <ThemedText.BodyPrimary>Tokenomics</ThemedText.BodyPrimary>
              </Column>
              <Column>
                <SmallButtonPrimary
                  data-testid="add-tokenomics-button"
                  disabled={false}
                  width="fit-content"
                  style={{ borderRadius: '12px' }}
                  padding="1px 4px"
                  onClick={onAddTokenomics}
                >
                  <ThemedText.DeprecatedMain color={theme.white}>
                    <Trans>Add Tokenomics Entry</Trans>
                  </ThemedText.DeprecatedMain>
                </SmallButtonPrimary>
              </Column>
            </Row>
            <TableWrapper data-testid="tokenomics-table">
              <SimpleTable headers={tokenomicsHeaders} data={tokenomicsData} />
            </TableWrapper>
            {tokenomicsModalOpened && (
              <AddTokenomicsModal
                isOpen={true}
                onDismiss={() => setTokenomicsModalOpened(false)}
                onSubmit={addTokenomics}
              />
            )}

            <Row marginBottom="8px" marginTop="12px" marginLeft="4px">
              <Column flex="1">
                <ThemedText.BodyPrimary>Team</ThemedText.BodyPrimary>
              </Column>
              <Column>
                <SmallButtonPrimary
                  data-testid="add-team-button"
                  disabled={false}
                  width="fit-content"
                  style={{ borderRadius: '12px' }}
                  padding="1px 4px"
                  onClick={onAddTeamMember}
                >
                  <ThemedText.DeprecatedMain color={theme.white}>
                    <Trans>Add Team member</Trans>
                  </ThemedText.DeprecatedMain>
                </SmallButtonPrimary>
              </Column>
            </Row>
            <TableWrapper data-testid="team-table">
              <SimpleTable headers={teamColumnHeaders} data={teamMembersData} />
            </TableWrapper>
            {teamModalOpened && (
              <AddTeamMemberModal isOpen={true} onDismiss={() => setTeamModalOpened(false)} onSubmit={addTeamMember} />
            )}

            <Divider />

            <ThemedText.MediumHeader marginBottom="12px">Launchpad Settings</ThemedText.MediumHeader>

            <Row marginBottom="12px">
              <ActionSelector
                title="Select Payment Currency"
                items={quoteTokens}
                selectedAction={selectedQuoteToken}
                onActionSelect={setSelectedQuoteToken}
              />
            </Row>
            <Row gap="10px" marginBottom="12px">
              <Column flex="1">
                <NumericalInputPanel
                  label="Total Token on Sale"
                  placeholder="Total Token on Sale"
                  value={sellAmount}
                  onChange={setSellAmount}
                />
              </Column>
              <Column flex="1">
                <NumericalInputPanel label="Soft Cap" placeholder="Soft cap" value={softCap} onChange={setSoftCap} />
              </Column>
            </Row>
            <Row gap="10px" marginBottom="12px">
              <Column flex="1">
                <NumericalInputPanel
                  label="Sell Price"
                  placeholder="Sell Price"
                  value={sellPrice}
                  onChange={setSellPrice}
                />
              </Column>
              <Column flex="1">
                <NumericalInputPanel
                  label="Listing Price"
                  placeholder="Listing Price"
                  value={listingPrice}
                  onChange={setListingPrice}
                />
              </Column>
            </Row>
            <Row gap="10px" marginBottom="12px">
              <Column flex="1">
                <TextInputPanel
                  label="Start Date"
                  placeholder="e.g. 2025-01-01 15:00:00"
                  value={startDate}
                  onChange={setStartDate}
                />
              </Column>
              <Column flex="1">
                <NumericalInputPanel
                  label="Duration"
                  placeholder="Duration in days"
                  value={duration}
                  onChange={setDuration}
                />
              </Column>
            </Row>
            <Row gap="10px" marginBottom="12px">
              <Column flex="1">
                <NumericalInputPanel
                  label="Unlocked at TGE"
                  placeholder="Percentage of Unlocked Tokens on TGE"
                  value={unlockedTge}
                  onChange={setUnlockedTge}
                />
              </Column>
              <Column flex="1">
                <NumericalInputPanel
                  label="Vesting Duration"
                  placeholder="Vesting Duration in days"
                  value={vestingDuration}
                  onChange={setVestingDuration}
                />
              </Column>
            </Row>

            <Divider />

            <ThemedText.MediumHeader marginBottom="12px">Automoted Liquidity</ThemedText.MediumHeader>

            <Row marginBottom="12px">
              <NumericalInputPanel
                label="Liquidity Percentage (%)"
                placeholder="How much amount of the raised tokend will be used as liquidity"
                value={liquidityPercentage}
                onChange={setLiquidityPercentage}
              />
            </Row>
            <Row marginBottom="12px">
              <ActionSelector
                title="Liquidity Preference"
                items={liqActions}
                selectedAction={selectedLiqAction}
                onActionSelect={setSelectedLiqAction}
              />
            </Row>
            {selectedLiqAction == 'LOCK' && (
              <Row marginBottom="12px">
                <NumericalInputPanel
                  label="Locking Period"
                  placeholder="Locking period in days"
                  value={lockPeriod}
                  onChange={setLockPeriod}
                />
              </Row>
            )}

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
