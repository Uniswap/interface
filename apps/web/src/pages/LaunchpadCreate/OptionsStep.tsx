/* eslint-disable @typescript-eslint/no-unused-vars */

import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
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
import { useAtom } from 'jotai'
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
import { TeamTableValues, TokenomicsTableValues, launchpadParams } from './launchpad-state'

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

export default function OptionsStep({ onNext }: { onNext: () => void }) {
  //const { account, chainId } = useWeb3React()

  const proposalThreshold: CurrencyAmount<Token> | undefined = undefined

  const theme = useTheme()

  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const [options, setOptions] = useAtom(launchpadParams)
  const setOptionsProp = (propName: string, value: string) => {
    const path = propName.split('.')
    setOptions((oldVal) => {
      const newVal: any = { ...oldVal }
      newVal[path[0]] = {
        ...newVal[path[0]],
        [path[1]]: value,
      }
      return newVal
    })
  }

  const token = useToken(options.tokenInfo.tokenAddress)

  // ----- tokenomics -----
  const [tokenomicsModalOpened, setTokenomicsModalOpened] = useState(false)
  const tokenomicsHeaders = ['#', 'Type', 'Amount', 'Unlocked at TGE', 'Cliff', 'Vesting']
  const tokenomicsData = options.tokenInfo.tokenomics.map((info) => [
    info.index.toString(),
    info.name,
    info.amount.toString(),
    info.unlockedAmount.toString(),
    info.cliffInDays.toString(),
    info.vestingInDays.toString(),
  ])
  const onAddTokenomics = () => {
    setTokenomicsModalOpened(true)
  }
  const addTokenomics = (tokenomicsInfo: TokenomicsTableValues) => {
    setOptions((oldVal) => {
      const newArray = [...oldVal.tokenInfo.tokenomics, tokenomicsInfo]
      newArray.forEach((item, i) => {
        item.index = i + 1
      })
      return {
        ...oldVal,
        tokenInfo: {
          ...oldVal.tokenInfo,
          tokenomics: newArray,
        },
      }
    })
    setTokenomicsModalOpened(false)
  }
  // ------

  // ------ Team -------
  const teamColumnHeaders = ['#', 'Image', 'Name', 'Position']
  //const teamMembersData = teamMembers.map((t) => [t.index.toString(), t.name, t.position])
  const teamMembersData = options.tokenInfo.teamMembers.map((teamMember) => [
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
    setOptions((oldVal) => {
      const newArray = [...oldVal.tokenInfo.teamMembers, tokenomicsInfo]
      newArray.forEach((item, i) => {
        item.index = i + 1
      })
      return {
        ...oldVal,
        tokenInfo: {
          ...oldVal.tokenInfo,
          teamMembers: newArray,
        },
      }
    })
    setTeamModalOpened(false)
  }
  // ------

  // CELO / UBE / USDT / USDC / cUSD / GLOUSD
  const quoteTokens: Action[] = [
    {
      id: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      name: 'CELO',
    },
    {
      id: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
      name: 'UBE',
    },
    {
      id: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
      name: 'USDT',
    },
    {
      id: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
      name: 'USDC',
    },
    {
      id: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      name: 'cUSD',
    },
    {
      id: '0x4F604735c1cF31399C6E711D5962b2B3E0225AD3',
      name: 'GLOUSD',
    },
  ]

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

  const liqFees: Action[] = [
    {
      id: '100',
      name: '0.01%',
    },
    {
      id: '500',
      name: '0.05%',
    },
    {
      id: '3000',
      name: '0.3%',
    },
    {
      id: '10000',
      name: '1%',
    },
  ]

  const liqRanges: Action[] = [
    {
      id: 'NARROW',
      name: 'Narrow Range (66% ↓ \u00A0-\u00A0 3X ↑)',
    },
    {
      id: 'MEDIUM',
      name: 'Medium Range (90% ↓ \u00A0-\u00A0 10X ↑)',
    },
    {
      id: 'WIDE',
      name: 'Wide Range (99% ↓ \u00A0-\u00A0 100X ↑)',
    },
    {
      id: 'FULL',
      name: 'Full Range',
    },
  ]

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
    <PageWrapper>
      <AppBody $maxWidth="800px">
        <Nav to="/vote">
          <BackArrow />
          <HeaderText>Launchpad Options</HeaderText>
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
            value={options.tokenInfo.tokenAddress}
            onChange={(val) => setOptionsProp('tokenInfo.tokenAddress', val)}
          />

          <ThemedText.SubHeaderSmall style={{ padding: '2px 0 12px 16px' }}>
            {token ? `Name: ${token.name} \u00A0\u00A0\u00A0\u00A0 Symbol: ${token.symbol}` : 'Invalid token adress'}
          </ThemedText.SubHeaderSmall>

          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <TextInputPanel
                label="Token Logo"
                placeholder="Token logo url must be 200x200 png image link."
                value={options.tokenInfo.logoUrl}
                onChange={(val) => setOptionsProp('tokenInfo.logoUrl', val)}
              />
            </Column>
            {options.tokenInfo.logoUrl && (
              <div style={{ width: '85px', height: '85px' }}>
                <img src={options.tokenInfo.logoUrl} alt="logo" style={{ width: '100%', height: '100%' }} />
              </div>
            )}
          </Row>

          <Row marginBottom="12px">
            <TextareaPanel
              label="Description"
              value={options.tokenInfo.description}
              onChange={(val) => setOptionsProp('tokenInfo.description', val)}
              placeholder="Project info"
              fontSize="1rem"
              minHeight="100px"
            />
          </Row>

          <Row marginBottom="12px">
            <TextareaPanel
              label="Audit Links"
              value={options.tokenInfo.auditLinks}
              onChange={(val) => setOptionsProp('tokenInfo.auditLinks', val)}
              placeholder="Audit links line by line"
              fontSize="1rem"
              minHeight="50px"
            />
          </Row>

          <Row marginBottom="12px">
            <TextInputPanel
              label="Project Website"
              placeholder="Website link"
              value={options.tokenInfo.website}
              onChange={(val) => setOptionsProp('tokenInfo.website', val)}
            />
          </Row>

          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <TextInputPanel
                label="Twitter/X"
                placeholder="Twitter page link"
                value={options.tokenInfo.twitter}
                onChange={(val) => setOptionsProp('tokenInfo.twitter', val)}
              />
            </Column>
            <Column flex="1">
              <TextInputPanel
                label="Telegram"
                placeholder="Telegram group link"
                value={options.tokenInfo.telegram}
                onChange={(val) => setOptionsProp('tokenInfo.telegram', val)}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <TextInputPanel
                label="Discord"
                placeholder="Discord link"
                value={options.tokenInfo.discord}
                onChange={(val) => setOptionsProp('tokenInfo.discord', val)}
              />
            </Column>
            <Column flex="1">
              <TextInputPanel
                label="Medium"
                placeholder="Medium link"
                value={options.tokenInfo.medium}
                onChange={(val) => setOptionsProp('tokenInfo.medium', val)}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <TextInputPanel
                label="Youtube"
                placeholder="Youtube link"
                value={options.tokenInfo.youtube}
                onChange={(val) => setOptionsProp('tokenInfo.youtube', val)}
              />
            </Column>
            <Column flex="1">
              <TextInputPanel
                label="Farcaster"
                placeholder="Farcaster link"
                value={options.tokenInfo.farcaster}
                onChange={(val) => setOptionsProp('tokenInfo.farcaster', val)}
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
              selectedAction={options.tokenSale.quoteToken}
              onActionSelect={(val) => setOptionsProp('tokenSale.quoteToken', val)}
            />
          </Row>
          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <NumericalInputPanel
                label="Total Token on Sale"
                placeholder="Total Token on Sale"
                value={options.tokenSale.hardCapAsQuote}
                onChange={(val) => setOptionsProp('tokenSale.hardCapAsQuote', val)}
              />
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Soft Cap"
                placeholder="Soft cap"
                value={options.tokenSale.softCapAsQuote}
                onChange={(val) => setOptionsProp('tokenSale.softCapAsQuote', val)}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <NumericalInputPanel
                label="Sell Price"
                placeholder="Sell Price"
                value={options.tokenSale.sellPrice}
                onChange={(val) => setOptionsProp('tokenSale.sellPrice', val)}
              />
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Listing Price"
                placeholder="Listing Price"
                value={options.liquidity.listingPrice}
                onChange={(val) => setOptionsProp('liquidity.listingPrice', val)}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <TextInputPanel
                label="Start Date"
                placeholder="e.g. 2025-01-01 15:00:00"
                value={options.tokenSale.startDate}
                onChange={(val) => setOptionsProp('tokenSale.startDate', val)}
              />
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Duration"
                placeholder="Duration in days"
                value={options.tokenSale.durationDays}
                onChange={(val) => setOptionsProp('tokenSale.durationDays', val)}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <NumericalInputPanel
                label="Unlocked at TGE"
                placeholder="Percentage of Unlocked Tokens on TGE"
                value={options.tokenSale.initialReleaseRate}
                onChange={(val) => setOptionsProp('tokenSale.initialReleaseRate', val)}
              />
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Vesting Duration"
                placeholder="Vesting Duration in days"
                value={options.tokenSale.releaseDurationDays}
                onChange={(val) => setOptionsProp('tokenSale.releaseDurationDays', val)}
              />
            </Column>
          </Row>

          <Divider />

          <ThemedText.MediumHeader marginBottom="12px">Automoted Liquidity</ThemedText.MediumHeader>

          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <NumericalInputPanel
                label="Liquidity Percentage (%)"
                placeholder="How much amount of the raised tokend will be used as liquidity"
                value={options.liquidity.liquidityRate}
                onChange={(val) => setOptionsProp('liquidity.liquidityRate', val)}
              />
            </Column>
            <Column flex="1">
              <ActionSelector
                title="Fee amount of the liquidity pool"
                items={liqFees}
                selectedAction={options.liquidity.liquidityFee}
                onActionSelect={(val) => setOptionsProp('liquidity.liquidityFee', val)}
              />
            </Column>
          </Row>
          <Row marginBottom="12px">
            <ActionSelector
              title="Price Range for the liquidity"
              items={liqRanges}
              selectedAction={options.liquidity.liquidityRange}
              onActionSelect={(val) => setOptionsProp('liquidity.liquidityRange', val)}
            />
          </Row>
          <Row marginBottom="12px">
            <ActionSelector
              title="Liquidity Preference"
              items={liqActions}
              selectedAction={options.liquidity.liquidityAction}
              onActionSelect={(val) => setOptionsProp('liquidity.liquidityAction', val)}
            />
          </Row>
          {options.liquidity.liquidityAction == 'LOCK' && (
            <Row marginBottom="12px">
              <NumericalInputPanel
                label="Locking Period"
                placeholder="Locking period in days"
                value={options.liquidity.lockDurationDays}
                onChange={(val) => setOptionsProp('liquidity.lockDurationDays', val)}
              />
            </Row>
          )}

          <ButtonPrimary onClick={onNext}>Next</ButtonPrimary>

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
  )
}
