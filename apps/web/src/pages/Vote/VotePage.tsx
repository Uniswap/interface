import { BigNumber } from '@ethersproject/bignumber'
import { InterfacePageName } from '@uniswap/analytics-events'
import { NEVER_RELOAD } from '@uniswap/redux-multicall'
import { CurrencyAmount, Fraction, Token } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { GrayCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { CardSection, DataCard } from 'components/earn/styled'
import DelegateModal from 'components/vote/DelegateModal'
import ExecuteModal from 'components/vote/ExecuteModal'
import QueueModal from 'components/vote/QueueModal'
import VoteModal from 'components/vote/VoteModal'
import {
  AVERAGE_BLOCK_TIME_IN_SECS,
  COMMON_CONTRACT_NAMES,
  DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
} from 'constants/governance'
import { ZERO_ADDRESS } from 'constants/misc'
import { UNI } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { useActiveLocale } from 'hooks/useActiveLocale'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import styled from 'lib/styled-components'
import ms from 'ms'
import { ProposalStatus } from 'pages/Vote/styled'
import { useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactMarkdown from 'react-markdown'
import { useParams } from 'react-router-dom'
import {
  useModalIsOpen,
  useToggleDelegateModal,
  useToggleExecuteModal,
  useToggleQueueModal,
  useToggleVoteModal,
} from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useTokenBalance } from 'state/connection/hooks'
import {
  ProposalData,
  ProposalState,
  useProposalData,
  useQuorum,
  useUserDelegatee,
  useUserVotesAsOfBlock,
} from 'state/governance/hooks'
import { VoteOption } from 'state/governance/types'
import { ExternalLink, StyledInternalLink, ThemedText } from 'theme/components'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isAddress } from 'utilities/src/addresses'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const PageWrapper = styled(AutoColumn)`
  padding-top: 68px;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const ProposalInfo = styled(AutoColumn)`
  background: ${({ theme }) => theme.surface1};
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  max-width: 640px;
  width: 100%;
`

const ArrowWrapper = styled(StyledInternalLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  color: ${({ theme }) => theme.neutral1};

  a {
    color: ${({ theme }) => theme.neutral1};
    text-decoration: none;
  }
  :hover {
    text-decoration: none;
  }
`
const CardWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
`

const StyledDataCard = styled(DataCard)`
  width: 100%;
  background: none;
  background-color: ${({ theme }) => theme.surface1};
  height: fit-content;
  z-index: 2;
`

const ProgressWrapper = styled.div`
  width: 100%;
  margin-top: 1rem;
  height: 4px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.surface2};
  position: relative;
`

const Progress = styled.div<{ status: 'for' | 'against'; percentageString?: string }>`
  height: 4px;
  border-radius: 4px;
  background-color: ${({ theme, status }) => (status === 'for' ? theme.success : theme.critical)};
  width: ${({ percentageString }) => percentageString ?? '0%'};
`

const MarkDownWrapper = styled.div`
  max-width: 640px;
  overflow: hidden;
`

const WrapSmall = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    align-items: flex-start;
    flex-direction: column;
  `};
`

const DetailText = styled.div`
  word-break: break-all;
`

const ProposerAddressLink = styled(ExternalLink)`
  word-break: break-all;
`

function getDateFromBlock(
  targetBlock: number | undefined,
  currentBlock: number | undefined,
  averageBlockTimeInSeconds: number | undefined,
  currentTimestamp: BigNumber | undefined,
): Date | undefined {
  if (targetBlock && currentBlock && averageBlockTimeInSeconds && currentTimestamp) {
    const date = new Date()
    date.setTime(
      currentTimestamp
        .add(BigNumber.from(averageBlockTimeInSeconds).mul(BigNumber.from(targetBlock - currentBlock)))
        .toNumber() * ms(`1s`),
    )
    return date
  }
  return undefined
}

export default function VotePage() {
  // see https://github.com/remix-run/react-router/issues/8200#issuecomment-962520661
  const { governorIndex, id } = useParams() as { governorIndex: string; id: string }
  const parsedGovernorIndex = Number.parseInt(governorIndex)

  const account = useAccount()

  const quorumAmount = useQuorum(parsedGovernorIndex)

  // get data for this specific proposal
  const proposalData: ProposalData | undefined = useProposalData(parsedGovernorIndex, id)

  // update vote option based on button interactions
  const [voteOption, setVoteOption] = useState<VoteOption | undefined>(undefined)

  // modal for casting votes
  const showVoteModal = useModalIsOpen(ApplicationModal.VOTE)
  const toggleVoteModal = useToggleVoteModal()

  // toggle for showing delegation modal
  const showDelegateModal = useModalIsOpen(ApplicationModal.DELEGATE)
  const toggleDelegateModal = useToggleDelegateModal()

  // toggle for showing queue modal
  const showQueueModal = useModalIsOpen(ApplicationModal.QUEUE)
  const toggleQueueModal = useToggleQueueModal()

  // toggle for showing execute modal
  const showExecuteModal = useModalIsOpen(ApplicationModal.EXECUTE)
  const toggleExecuteModal = useToggleExecuteModal()

  // get and format date from data
  const currentTimestamp = useCurrentBlockTimestamp(NEVER_RELOAD)
  const currentBlock = useBlockNumber()
  const startDate = getDateFromBlock(
    proposalData?.startBlock,
    currentBlock,
    (account.chainId && AVERAGE_BLOCK_TIME_IN_SECS[account.chainId]) ?? DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
    currentTimestamp,
  )
  const endDate = getDateFromBlock(
    proposalData?.endBlock,
    currentBlock,
    (account.chainId && AVERAGE_BLOCK_TIME_IN_SECS[account.chainId]) ?? DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
    currentTimestamp,
  )
  const now = new Date()
  const locale = useActiveLocale()
  const dateFormat: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  }
  // convert the eta to milliseconds before it's a date
  const eta = proposalData?.eta ? new Date(proposalData.eta.mul(ms(`1s`)).toNumber()) : undefined

  // get total votes and format percentages for UI
  const totalVotes = proposalData?.forCount?.add(proposalData.againstCount)
  const forPercentage = totalVotes
    ? proposalData?.forCount?.asFraction?.divide(totalVotes.asFraction)?.multiply(100)
    : undefined
  const againstPercentage = forPercentage ? new Fraction(100).subtract(forPercentage) : undefined

  // only count available votes as of the proposal start block
  const availableVotes: CurrencyAmount<Token> | undefined = useUserVotesAsOfBlock(proposalData?.startBlock ?? undefined)

  // only show voting if user has > 0 votes at proposal start block and proposal is active,
  const showVotingButtons =
    availableVotes &&
    JSBI.greaterThan(availableVotes.quotient, JSBI.BigInt(0)) &&
    proposalData &&
    proposalData.status === ProposalState.ACTIVE

  // we only show the button if there's an account connected and the proposal state is correct
  const showQueueButton = account.isConnected && proposalData?.status === ProposalState.SUCCEEDED

  // we only show the button if there's an account connected and the proposal state is correct
  const showExecuteButton = account.isConnected && proposalData?.status === ProposalState.QUEUED

  const uniBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account.address,
    account.chainId ? UNI[account.chainId] : undefined,
  )
  const userDelegatee: string | undefined = useUserDelegatee()

  // in blurb link to home page if they are able to unlock
  const showLinkForUnlock = Boolean(
    uniBalance && JSBI.notEqual(uniBalance.quotient, JSBI.BigInt(0)) && userDelegatee === ZERO_ADDRESS,
  )

  // show links in propsoal details if content is an address
  // if content is contract with common name, replace address with common name
  const linkIfAddress = (content: string) => {
    if (isAddress(content) && account.chainId) {
      const commonName = COMMON_CONTRACT_NAMES[account.chainId]?.[content] ?? content
      return (
        <ExternalLink href={getExplorerLink(account.chainId, content, ExplorerDataType.ADDRESS)}>
          {commonName}
        </ExternalLink>
      )
    }
    return <span>{content}</span>
  }

  function MarkdownImage({ ...rest }) {
    return <img {...rest} style={{ width: '100%', height: '100$', objectFit: 'cover' }} alt="" />
  }

  return (
    <Trace logImpression page={InterfacePageName.VOTE_PAGE}>
      <>
        <PageWrapper gap="lg" justify="center">
          <VoteModal
            isOpen={showVoteModal}
            onDismiss={toggleVoteModal}
            proposalId={proposalData?.id}
            voteOption={voteOption}
          />
          <DelegateModal
            isOpen={showDelegateModal}
            onDismiss={toggleDelegateModal}
            title={<Trans i18nKey="vote.votePage.unlockVotes" />}
          />
          <QueueModal isOpen={showQueueModal} onDismiss={toggleQueueModal} proposalId={proposalData?.id} />
          <ExecuteModal isOpen={showExecuteModal} onDismiss={toggleExecuteModal} proposalId={proposalData?.id} />
          <ProposalInfo gap="lg" justify="start">
            <RowBetween style={{ width: '100%' }}>
              <ArrowWrapper to="/vote">
                <Trans
                  i18nKey="vote.votePage.allProposals"
                  values={{
                    arrow: <ArrowLeft size={20} />,
                  }}
                />
              </ArrowWrapper>
              {proposalData && <ProposalStatus status={proposalData.status} />}
            </RowBetween>
            <AutoColumn gap="10px" style={{ width: '100%' }}>
              <ThemedText.DeprecatedLargeHeader style={{ marginBottom: '.5rem' }}>
                {proposalData?.title}
              </ThemedText.DeprecatedLargeHeader>
              <RowBetween>
                <ThemedText.DeprecatedMain>
                  {startDate && startDate > now ? (
                    <Trans
                      i18nKey="vote.votePage.votingStarts"
                      values={{
                        date: startDate.toLocaleString(locale, dateFormat),
                      }}
                    />
                  ) : null}
                </ThemedText.DeprecatedMain>
              </RowBetween>
              <RowBetween>
                <ThemedText.DeprecatedMain>
                  {endDate &&
                    (endDate < now ? (
                      <Trans
                        i18nKey="vote.votePage.votingEnded"
                        values={{
                          date: endDate.toLocaleString(locale, dateFormat),
                        }}
                      />
                    ) : (
                      <Trans
                        i18nKey="vote.votePage.votingEnds"
                        values={{
                          date: endDate.toLocaleString(locale, dateFormat),
                        }}
                      />
                    ))}
                </ThemedText.DeprecatedMain>
              </RowBetween>
              {proposalData && proposalData.status === ProposalState.ACTIVE && !showVotingButtons && (
                <GrayCard>
                  <ThemedText.DeprecatedBlack>
                    <Trans
                      i18nKey="vote.votePage.onlyUniVotesBeforeBlockEligible"
                      values={{
                        startBlock: proposalData.startBlock,
                      }}
                    />{' '}
                    {showLinkForUnlock && (
                      <span>
                        <Trans
                          i18nKey="vote.votePage.unlockVotingLink"
                          values={{
                            link: <StyledInternalLink to="/vote">Unlock voting</StyledInternalLink>,
                          }}
                        />
                      </span>
                    )}
                  </ThemedText.DeprecatedBlack>
                </GrayCard>
              )}
            </AutoColumn>
            {showVotingButtons && (
              <RowFixed style={{ width: '100%', gap: '12px' }}>
                <ButtonPrimary
                  padding="8px"
                  $borderRadius="8px"
                  onClick={() => {
                    setVoteOption(VoteOption.For)
                    toggleVoteModal()
                  }}
                >
                  <Trans i18nKey="vote.votePage.voteFor" />
                </ButtonPrimary>
                <ButtonPrimary
                  padding="8px"
                  $borderRadius="8px"
                  onClick={() => {
                    setVoteOption(VoteOption.Against)
                    toggleVoteModal()
                  }}
                >
                  <Trans i18nKey="vote.votePage.voteAgainst" />
                </ButtonPrimary>
              </RowFixed>
            )}
            {showQueueButton && (
              <RowFixed style={{ width: '100%', gap: '12px' }}>
                <ButtonPrimary
                  padding="8px"
                  $borderRadius="8px"
                  onClick={() => {
                    toggleQueueModal()
                  }}
                >
                  <Trans i18nKey="common.queue" />
                </ButtonPrimary>
              </RowFixed>
            )}
            {showExecuteButton && (
              <>
                {eta && (
                  <RowBetween>
                    <ThemedText.DeprecatedBlack>
                      <Trans
                        i18nKey="vote.votePage.mayBeExecutedAfter"
                        values={{
                          eta: eta.toLocaleString(locale, dateFormat),
                        }}
                      />
                    </ThemedText.DeprecatedBlack>
                  </RowBetween>
                )}
                <RowFixed style={{ width: '100%', gap: '12px' }}>
                  <ButtonPrimary
                    padding="8px"
                    $borderRadius="8px"
                    onClick={() => {
                      toggleExecuteModal()
                    }}
                    // can't execute until the eta has arrived
                    disabled={!currentTimestamp || !proposalData?.eta || currentTimestamp.lt(proposalData.eta)}
                  >
                    <Trans i18nKey="vote.votePage.execute" />
                  </ButtonPrimary>
                </RowFixed>
              </>
            )}
            <CardWrapper>
              <StyledDataCard>
                <CardSection>
                  <AutoColumn gap="md">
                    <WrapSmall>
                      <ThemedText.DeprecatedBlack fontWeight={535}>
                        <Trans i18nKey="common.for" />
                      </ThemedText.DeprecatedBlack>
                      {proposalData && (
                        <ThemedText.DeprecatedBlack fontWeight={535}>
                          {proposalData.forCount.toFixed(0, { groupSeparator: ',' })}
                          {quorumAmount && (
                            <span style={{ fontWeight: 485 }}>{` / ${quorumAmount.toExact({
                              groupSeparator: ',',
                            })}`}</span>
                          )}
                        </ThemedText.DeprecatedBlack>
                      )}
                    </WrapSmall>
                  </AutoColumn>
                  <ProgressWrapper>
                    <Progress
                      status="for"
                      percentageString={
                        proposalData?.forCount.greaterThan(0) ? `${forPercentage?.toFixed(0) ?? 0}%` : '0%'
                      }
                    />
                  </ProgressWrapper>
                </CardSection>
              </StyledDataCard>
              <StyledDataCard>
                <CardSection>
                  <AutoColumn gap="md">
                    <WrapSmall>
                      <ThemedText.DeprecatedBlack fontWeight={535}>
                        <Trans i18nKey="vote.votePage.against" />
                      </ThemedText.DeprecatedBlack>
                      {proposalData && (
                        <ThemedText.DeprecatedBlack fontWeight={535}>
                          {proposalData.againstCount.toFixed(0, { groupSeparator: ',' })}
                        </ThemedText.DeprecatedBlack>
                      )}
                    </WrapSmall>
                  </AutoColumn>
                  <ProgressWrapper>
                    <Progress
                      status="against"
                      percentageString={
                        proposalData?.againstCount?.greaterThan(0) ? `${againstPercentage?.toFixed(0) ?? 0}%` : '0%'
                      }
                    />
                  </ProgressWrapper>
                </CardSection>
              </StyledDataCard>
            </CardWrapper>
            <AutoColumn gap="md">
              <ThemedText.DeprecatedMediumHeader fontWeight={535}>
                <Trans i18nKey="vote.votePage.details" />
              </ThemedText.DeprecatedMediumHeader>
              {proposalData?.details?.map((d, i) => {
                return (
                  <DetailText key={i}>
                    {i + 1}: {linkIfAddress(d.target)}.{d.functionSig}(
                    {d.callData.split(',').map((content, i) => {
                      return (
                        <span key={i}>
                          {linkIfAddress(content)}
                          {d.callData.split(',').length - 1 === i ? '' : ','}
                        </span>
                      )
                    })}
                    )
                  </DetailText>
                )
              })}
            </AutoColumn>
            <AutoColumn gap="md">
              <ThemedText.DeprecatedMediumHeader fontWeight={535}>
                <Trans i18nKey="vote.votePage.description" />
              </ThemedText.DeprecatedMediumHeader>
              <MarkDownWrapper>
                <ReactMarkdown
                  source={proposalData?.description}
                  renderers={{
                    image: MarkdownImage,
                  }}
                />
              </MarkDownWrapper>
            </AutoColumn>
            <AutoColumn gap="md">
              <ThemedText.DeprecatedMediumHeader fontWeight={535}>
                <Trans i18nKey="vote.votePage.proposer" />
              </ThemedText.DeprecatedMediumHeader>
              <ProposerAddressLink
                href={
                  proposalData?.proposer && account.chainId
                    ? getExplorerLink(account.chainId, proposalData?.proposer, ExplorerDataType.ADDRESS)
                    : ''
                }
              >
                <ReactMarkdown source={proposalData?.proposer} />
              </ProposerAddressLink>
            </AutoColumn>
          </ProposalInfo>
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
