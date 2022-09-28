import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName } from 'analytics/constants'
import { Trace } from 'analytics/Trace'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from 'components/earn/styled'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Loader from 'components/Loader'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import Toggle from 'components/Toggle'
import DelegateModal from 'components/vote/DelegateModal'
import ProposalEmptyState from 'components/vote/ProposalEmptyState'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import JSBI from 'jsbi'
import { darken } from 'polished'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'rebass/styled-components'
import { useModalIsOpen, useToggleDelegateModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useTokenBalance } from 'state/connection/hooks'
import { ProposalData, ProposalState } from 'state/governance/hooks'
import { useAllProposalData, useUserDelegatee, useUserVotes } from 'state/governance/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { shortenAddress } from 'utils'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { ZERO_ADDRESS } from '../../constants/misc'
import { UNI } from '../../constants/tokens'
import { ProposalStatus } from './styled'

const PageWrapper = styled(AutoColumn)<{ navBarFlag: boolean }>`
  padding-top: ${({ navBarFlag }) => (navBarFlag ? '68px' : '0px')};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: ${({ navBarFlag }) => (navBarFlag ? '48px 8px 0px' : '0px 8px 0px')};
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: ${({ navBarFlag }) => (navBarFlag ? '20px' : '0px')};
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
  color: ${({ theme }) => theme.deprecated_text1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.deprecated_bg1};
  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.deprecated_bg1)};
  }
  &:hover {
    background-color: ${({ theme }) => theme.deprecated_bg2};
  }
`

const ProposalNumber = styled.span`
  opacity: ${({ theme }) => theme.opacity.hover};
  flex: 0 0 40px;
`

const ProposalTitle = styled.span`
  font-weight: 600;
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

const TextButton = styled(ThemedText.DeprecatedMain)`
  color: ${({ theme }) => theme.deprecated_primary1};
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

const AddressButton = styled.div`
  border: 1px solid ${({ theme }) => theme.deprecated_bg3};
  padding: 2px 4px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.deprecated_text1};
`

export default function Landing() {
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const theme = useTheme()
  const { account, chainId } = useWeb3React()

  const [hideCancelled, setHideCancelled] = useState(true)

  // toggle for showing delegation modal
  const showDelegateModal = useModalIsOpen(ApplicationModal.DELEGATE)
  const toggleDelegateModal = useToggleDelegateModal()

  // get data to list all proposals
  const { data: allProposals, loading: loadingProposals } = useAllProposalData()

  // user data
  const { loading: loadingAvailableVotes, votes: availableVotes } = useUserVotes()
  const uniBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    chainId ? UNI[chainId] : undefined
  )
  const userDelegatee: string | undefined = useUserDelegatee()

  // show delegation option if they have have a balance, but have not delegated
  const showUnlockVoting = Boolean(
    uniBalance && JSBI.notEqual(uniBalance.quotient, JSBI.BigInt(0)) && userDelegatee === ZERO_ADDRESS
  )
  return (
    <>
      <Trace page={PageName.VOTE_PAGE} shouldLogImpression>
        <PageWrapper gap="lg" justify="center" navBarFlag={navBarFlagEnabled}>
          <DelegateModal
            isOpen={showDelegateModal}
            onDismiss={toggleDelegateModal}
            title={showUnlockVoting ? <Trans>Unlock Votes</Trans> : <Trans>Update Delegation</Trans>}
          />
          <TopSection gap="md">
            <VoteCard>
              <CardBGImage />
              <CardNoise />
              <CardSection>
                <AutoColumn gap="md">
                  <RowBetween>
                    <ThemedText.DeprecatedWhite fontWeight={600}>
                      <Trans>Uniswap Governance</Trans>
                    </ThemedText.DeprecatedWhite>
                  </RowBetween>
                  <RowBetween>
                    <ThemedText.DeprecatedWhite fontSize={14}>
                      <Trans>
                        UNI tokens represent voting shares in Uniswap governance. You can vote on each proposal yourself
                        or delegate your votes to a third party.
                      </Trans>
                    </ThemedText.DeprecatedWhite>
                  </RowBetween>
                  <ExternalLink
                    style={{
                      color: theme.deprecated_white,
                      textDecoration: 'underline',
                    }}
                    href="https://uniswap.org/blog/uni"
                    target="_blank"
                  >
                    <ThemedText.DeprecatedWhite fontSize={14}>
                      <Trans>Read more about Uniswap governance</Trans>
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
                <Trans>Proposals</Trans>
              </ThemedText.DeprecatedMediumHeader>
              <AutoRow gap="6px" justify="flex-end">
                {loadingProposals || loadingAvailableVotes ? <Loader /> : null}
                {showUnlockVoting ? (
                  <ButtonPrimary
                    style={{ width: 'fit-content' }}
                    padding="8px"
                    $borderRadius="8px"
                    onClick={toggleDelegateModal}
                  >
                    <Trans>Unlock Voting</Trans>
                  </ButtonPrimary>
                ) : availableVotes && JSBI.notEqual(JSBI.BigInt(0), availableVotes?.quotient) ? (
                  <ThemedText.DeprecatedBody fontWeight={500} mr="6px">
                    <Trans>
                      <FormattedCurrencyAmount currencyAmount={availableVotes} /> Votes
                    </Trans>
                  </ThemedText.DeprecatedBody>
                ) : uniBalance &&
                  userDelegatee &&
                  userDelegatee !== ZERO_ADDRESS &&
                  JSBI.notEqual(JSBI.BigInt(0), uniBalance?.quotient) ? (
                  <ThemedText.DeprecatedBody fontWeight={500} mr="6px">
                    <Trans>
                      <FormattedCurrencyAmount currencyAmount={uniBalance} /> Votes
                    </Trans>
                  </ThemedText.DeprecatedBody>
                ) : (
                  ''
                )}
                <ButtonPrimary
                  as={Link}
                  to="/create-proposal"
                  style={{ width: 'fit-content', borderRadius: '8px' }}
                  padding="8px"
                >
                  <Trans>Create Proposal</Trans>
                </ButtonPrimary>
              </AutoRow>
            </WrapSmall>
            {!showUnlockVoting && (
              <RowBetween>
                <div />
                {userDelegatee && userDelegatee !== ZERO_ADDRESS ? (
                  <RowFixed>
                    <ThemedText.DeprecatedBody fontWeight={500} mr="4px">
                      <Trans>Delegated to:</Trans>
                    </ThemedText.DeprecatedBody>
                    <AddressButton>
                      <StyledExternalLink
                        href={getExplorerLink(1, userDelegatee, ExplorerDataType.ADDRESS)}
                        style={{ margin: '0 4px' }}
                      >
                        {userDelegatee === account ? <Trans>Self</Trans> : shortenAddress(userDelegatee)}
                      </StyledExternalLink>
                      <TextButton onClick={toggleDelegateModal} style={{ marginLeft: '4px' }}>
                        <Trans>(edit)</Trans>
                      </TextButton>
                    </AddressButton>
                  </RowFixed>
                ) : (
                  ''
                )}
              </RowBetween>
            )}

            {allProposals?.length === 0 && <ProposalEmptyState />}

            {allProposals?.length > 0 && (
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedMain>
                    <Trans>Show Cancelled</Trans>
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
            <Trans>A minimum threshold of 0.25% of the total UNI supply is required to submit proposals</Trans>
          </ThemedText.DeprecatedSubHeader>
        </PageWrapper>
      </Trace>
      <SwitchLocaleLink />
    </>
  )
}
