import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Loader from 'components/Icons/LoadingSpinner'
import { AutoRow, RowBetween } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import Toggle from 'components/Toggle'
import { CardBGImage, CardNoise, CardSection, DataCard } from 'components/earn/styled'
import DelegateModal from 'components/vote/DelegateModal'
import ProposalEmptyState from 'components/vote/ProposalEmptyState'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import { darken } from 'polished'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'rebass/styled-components'
import { useModalIsOpen, useToggleDelegateModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
//import { useTokenBalance } from 'state/connection/hooks'
import { ProposalData, ProposalState, useAllProposalData, useUserVotes } from 'state/governance/hooks'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import Trace from 'uniswap/src/features/telemetry/Trace'
//import { shortenAddress } from 'utilities/src/addresses'
//import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { ProposalStatus } from './styled'

const PageWrapper = styled(AutoColumn)`
  padding-top: 68px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const TopSection = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const Proposal = styled(Button)`
  padding: 0.75rem 1rem;
  width: 100%;
  margin-top: 1rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  outline: none;
  cursor: pointer;
  color: ${({ theme }) => theme.neutral1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.surface1};
  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.surface1)};
  }
  &:hover {
    background-color: ${({ theme }) => theme.surface3};
  }
`

const ProposalNumber = styled.span`
  opacity: ${({ theme }) => theme.opacity.hover};
  flex: 0 0 40px;
`

const ProposalTitle = styled.span`
  font-weight: 535;
  flex: 1;
  max-width: 420px;
  white-space: initial;
  word-wrap: break-word;
  padding-right: 10px;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const WrapSmall = styled(RowBetween)`
  margin-bottom: 1rem;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-wrap: wrap;
  `};
`

const Header = styled(ThemedText.H1Small)`
  color: white;
  font-weight: 535;
  font-size: inherit;
  line-height: inherit;
`

export default function Landing() {
  const theme = useTheme()
  const [hideCancelled, setHideCancelled] = useState(true)

  const { account } = useWeb3React()

  // toggle for showing delegation modal
  const showDelegateModal = useModalIsOpen(ApplicationModal.DELEGATE)
  const toggleDelegateModal = useToggleDelegateModal()

  // get data to list all proposals
  const { data: allProposals, loading: loadingProposals } = useAllProposalData()

  // user data
  const { loading: loadingAvailableVotes, votes: availableVotes } = useUserVotes()

  // show delegation option if they have have a balance, but have not delegated
  const showUnlockVoting = availableVotes && Boolean(JSBI.equal(availableVotes.quotient, JSBI.BigInt(0)))
  return (
    <>
      <Trace logImpression page={InterfacePageName.VOTE_PAGE}>
        <PageWrapper gap="lg" justify="center">
          <DelegateModal
            isOpen={showDelegateModal}
            onDismiss={toggleDelegateModal}
            title={
              showUnlockVoting ? (
                <Trans i18nKey="vote.votePage.unlockVotes" />
              ) : (
                <Trans i18nKey="vote.votePage.updateDelegation" />
              )
            }
          />
          <TopSection gap="md">
            <VoteCard>
              <CardBGImage />
              <CardNoise />
              <CardSection>
                <AutoColumn gap="md">
                  <RowBetween>
                    <Header>
                      <Trans i18nKey="vote.landing.rigoblockGovernance" />
                    </Header>
                  </RowBetween>
                  <RowBetween>
                    <ThemedText.DeprecatedWhite fontSize={14}>
                      <Trans i18nKey="grg.votingShares" />
                    </ThemedText.DeprecatedWhite>
                  </RowBetween>
                  <ExternalLink
                    style={{
                      color: theme.white,
                      textDecoration: 'underline',
                    }}
                    href="https://docs.rigoblock.com/governance/rigoblock-governance"
                    target="_blank"
                  >
                    <ThemedText.DeprecatedWhite fontSize={14}>
                      <Trans i18nKey="vote.landing.readMoreAboutRigoblockGovernance.link" />
                    </ThemedText.DeprecatedWhite>
                  </ExternalLink>
                </AutoColumn>
              </CardSection>
              <CardBGImage />
              <CardNoise />
            </VoteCard>
          </TopSection>
          <TopSection gap="2px">
            <WrapSmall>
              <ThemedText.DeprecatedMediumHeader style={{ margin: '0.5rem 0.5rem 0.5rem 0', flexShrink: 0 }}>
                <Trans i18nKey="vote.landing.proposals" />
              </ThemedText.DeprecatedMediumHeader>
              <AutoRow gap="6px" justify="flex-end">
                {loadingProposals || loadingAvailableVotes ? (
                  <Loader />
                ) : account ? (
                  <ButtonPrimary
                    style={{ width: 'fit-content', height: '40px' }}
                    padding="8px"
                    $borderRadius="8px"
                    onClick={toggleDelegateModal}
                  >
                    <Trans i18nKey="vote.landing.unlockVoting" />
                  </ButtonPrimary>
                ) : availableVotes && JSBI.notEqual(JSBI.BigInt(0), availableVotes?.quotient) ? (
                  <ThemedText.DeprecatedBody fontWeight={535} mr="6px">
                    <Trans
                      i18nKey="vote.landing.voteAmount"
                      values={{
                        amount: <FormattedCurrencyAmount currencyAmount={availableVotes} />,
                      }}
                    />
                  </ThemedText.DeprecatedBody>
                ) : (
                  ''
                )}
                <ButtonPrimary
                  as={Link}
                  to="/create-proposal"
                  style={{ width: 'fit-content', borderRadius: '8px', height: '40px' }}
                  padding="8px"
                >
                  <Trans i18nKey="vote.landing.createProposal" />
                </ButtonPrimary>
              </AutoRow>
            </WrapSmall>

            {allProposals?.length === 0 && <ProposalEmptyState />}

            {allProposals?.length > 0 && (
              <AutoColumn gap="md">
                <RowBetween></RowBetween>
                <RowBetween>
                  <ThemedText.DeprecatedMain>
                    <Trans i18nKey="vote.landing.showCancelled" />
                  </ThemedText.DeprecatedMain>
                  <Toggle
                    isActive={!hideCancelled}
                    toggle={() => setHideCancelled((hideCancelled) => !hideCancelled)}
                  />
                </RowBetween>
              </AutoColumn>
            )}

            {allProposals
              ?.slice(0)
              ?.reverse()
              ?.filter((p: ProposalData) => (hideCancelled ? p.status !== ProposalState.CANCELED : true))
              ?.map((p: ProposalData) => {
                return (
                  <Proposal as={Link} to={`/vote/${p.governorIndex}/${p.id}`} key={`${p.governorIndex}${p.id}`}>
                    <ProposalNumber>
                      {p.governorIndex}.{p.id}
                    </ProposalNumber>
                    <ProposalTitle>{p.title}</ProposalTitle>
                    <ProposalStatus status={p.status} />
                  </Proposal>
                )
              })}
          </TopSection>

          <ThemedText.DeprecatedSubHeader color="text3">
            <Trans i18nKey="vote.landing.minThresholdRequired.error" />
          </ThemedText.DeprecatedSubHeader>
        </PageWrapper>
      </Trace>
      <SwitchLocaleLink />
    </>
  )
}
