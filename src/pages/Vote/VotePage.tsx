import React, { useState } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'

import { RouteComponentProps } from 'react-router-dom'
import { TYPE, StyledInternalLink, ExternalLink } from '../../theme'
import { RowFixed, RowBetween } from '../../components/Row'
import { CardSection, DataCard } from '../../components/earn/styled'
import { ArrowLeft } from 'react-feather'
import { ButtonPrimary } from '../../components/Button'
import { ProposalStatus } from './styled'
import { useProposalData, useUserVotesAsOfBlock, ProposalData, useUserDelegatee } from '../../state/governance/hooks'
import { useTimestampFromBlock } from '../../hooks/useTimestampFromBlock'
import { DateTime } from 'luxon'
import ReactMarkdown from 'react-markdown'
import VoteModal from '../../components/vote/VoteModal'
import { TokenAmount, JSBI } from '@uniswap/sdk'
import { useActiveWeb3React } from '../../hooks'
import { PROPOSAL_LENGTH_IN_SECS, COMMON_CONTRACT_NAMES, UNI, ZERO_ADDRESS } from '../../constants'
import { isAddress, getEtherscanLink } from '../../utils'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleDelegateModal, useToggleVoteModal } from '../../state/application/hooks'
import DelegateModal from '../../components/vote/DelegateModal'
import { GreyCard } from '../../components/Card'
import { useTokenBalance } from '../../state/wallet/hooks'

const PageWrapper = styled(AutoColumn)`
  width: 100%;
`

const ProposalInfo = styled(AutoColumn)`
  border: 1px solid ${({ theme }) => theme.bg4};
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
  color: ${({ theme }) => theme.text1};

  a {
    color: ${({ theme }) => theme.text1};
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
  background-color: ${({ theme }) => theme.bg1};
  height: fit-content;
  z-index: 2;
`

const ProgressWrapper = styled.div`
  width: 100%;
  margin-top: 1rem;
  height: 4px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.bg3};
  position: relative;
`

const Progress = styled.div<{ status: 'for' | 'against'; percentageString?: string }>`
  height: 4px;
  border-radius: 4px;
  background-color: ${({ theme, status }) => (status === 'for' ? theme.green1 : theme.red1)};
  width: ${({ percentageString }) => percentageString};
`

const MarkDownWrapper = styled.div`
  max-width: 640px;
  overflow: hidden;
`

const WrapSmall = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
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

export default function VotePage({
  match: {
    params: { id }
  }
}: RouteComponentProps<{ id: string }>) {
  const { chainId, account } = useActiveWeb3React()

  // get data for this specific proposal
  const proposalData: ProposalData | undefined = useProposalData(id)

  // update support based on button interactions
  const [support, setSupport] = useState<boolean>(true)

  // modal for casting votes
  const showVoteModal = useModalOpen(ApplicationModal.VOTE)
  const toggleVoteModal = useToggleVoteModal()

  // toggle for showing delegation modal
  const showDelegateModal = useModalOpen(ApplicationModal.DELEGATE)
  const toggelDelegateModal = useToggleDelegateModal()

  // get and format date from data
  const startTimestamp: number | undefined = useTimestampFromBlock(proposalData?.startBlock)
  const endDate: DateTime | undefined = startTimestamp
    ? DateTime.fromSeconds(startTimestamp).plus({ seconds: PROPOSAL_LENGTH_IN_SECS })
    : undefined
  const now: DateTime = DateTime.local()

  // get total votes and format percentages for UI
  const totalVotes: number | undefined = proposalData ? proposalData.forCount + proposalData.againstCount : undefined
  const forPercentage: string =
    proposalData && totalVotes ? ((proposalData.forCount * 100) / totalVotes).toFixed(0) + '%' : '0%'
  const againstPercentage: string =
    proposalData && totalVotes ? ((proposalData.againstCount * 100) / totalVotes).toFixed(0) + '%' : '0%'

  // only count available votes as of the proposal start block
  const availableVotes: TokenAmount | undefined = useUserVotesAsOfBlock(proposalData?.startBlock ?? undefined)

  // only show voting if user has > 0 votes at proposal start block and proposal is active,
  const showVotingButtons =
    availableVotes &&
    JSBI.greaterThan(availableVotes.raw, JSBI.BigInt(0)) &&
    proposalData &&
    proposalData.status === 'active'

  const uniBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, chainId ? UNI[chainId] : undefined)
  const userDelegatee: string | undefined = useUserDelegatee()

  // in blurb link to home page if they are able to unlock
  const showLinkForUnlock = Boolean(
    uniBalance && JSBI.notEqual(uniBalance.raw, JSBI.BigInt(0)) && userDelegatee === ZERO_ADDRESS
  )

  // show links in propsoal details if content is an address
  // if content is contract with common name, replace address with common name
  const linkIfAddress = (content: string) => {
    if (isAddress(content) && chainId) {
      const commonName = COMMON_CONTRACT_NAMES[content] ?? content
      return <ExternalLink href={getEtherscanLink(chainId, content, 'address')}>{commonName}</ExternalLink>
    }
    return <span>{content}</span>
  }

  return (
    <PageWrapper gap="lg" justify="center">
      <VoteModal isOpen={showVoteModal} onDismiss={toggleVoteModal} proposalId={proposalData?.id} support={support} />
      <DelegateModal isOpen={showDelegateModal} onDismiss={toggelDelegateModal} title="Unlock Votes" />
      <ProposalInfo gap="lg" justify="start">
        <RowBetween style={{ width: '100%' }}>
          <ArrowWrapper to="/vote">
            <ArrowLeft size={20} /> All Proposals
          </ArrowWrapper>
          {proposalData && <ProposalStatus status={proposalData?.status ?? ''}>{proposalData?.status}</ProposalStatus>}
        </RowBetween>
        <AutoColumn gap="10px" style={{ width: '100%' }}>
          <TYPE.largeHeader style={{ marginBottom: '.5rem' }}>{proposalData?.title}</TYPE.largeHeader>
          <RowBetween>
            <TYPE.main>
              {endDate && endDate < now
                ? 'Voting ended ' + (endDate && endDate.toLocaleString(DateTime.DATETIME_FULL))
                : proposalData
                ? 'Voting ends approximately ' + (endDate && endDate.toLocaleString(DateTime.DATETIME_FULL))
                : ''}
            </TYPE.main>
          </RowBetween>
          {proposalData && proposalData.status === 'active' && !showVotingButtons && (
            <GreyCard>
              <TYPE.black>
                Only UNI votes that were self delegated or delegated to another address before block{' '}
                {proposalData.startBlock} are eligible for voting.{' '}
                {showLinkForUnlock && (
                  <span>
                    <StyledInternalLink to="/vote">Unlock voting</StyledInternalLink> to prepare for the next proposal.
                  </span>
                )}
              </TYPE.black>
            </GreyCard>
          )}
        </AutoColumn>
        {showVotingButtons ? (
          <RowFixed style={{ width: '100%', gap: '12px' }}>
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              onClick={() => {
                setSupport(true)
                toggleVoteModal()
              }}
            >
              Vote For
            </ButtonPrimary>
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              onClick={() => {
                setSupport(false)
                toggleVoteModal()
              }}
            >
              Vote Against
            </ButtonPrimary>
          </RowFixed>
        ) : (
          ''
        )}
        <CardWrapper>
          <StyledDataCard>
            <CardSection>
              <AutoColumn gap="md">
                <WrapSmall>
                  <TYPE.black fontWeight={600}>For</TYPE.black>
                  <TYPE.black fontWeight={600}>
                    {' '}
                    {proposalData?.forCount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </TYPE.black>
                </WrapSmall>
              </AutoColumn>
              <ProgressWrapper>
                <Progress status={'for'} percentageString={forPercentage} />
              </ProgressWrapper>
            </CardSection>
          </StyledDataCard>
          <StyledDataCard>
            <CardSection>
              <AutoColumn gap="md">
                <WrapSmall>
                  <TYPE.black fontWeight={600}>Against</TYPE.black>
                  <TYPE.black fontWeight={600}>
                    {proposalData?.againstCount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </TYPE.black>
                </WrapSmall>
              </AutoColumn>
              <ProgressWrapper>
                <Progress status={'against'} percentageString={againstPercentage} />
              </ProgressWrapper>
            </CardSection>
          </StyledDataCard>
        </CardWrapper>
        <AutoColumn gap="md">
          <TYPE.mediumHeader fontWeight={600}>Details</TYPE.mediumHeader>
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
          <TYPE.mediumHeader fontWeight={600}>Description</TYPE.mediumHeader>
          <MarkDownWrapper>
            <ReactMarkdown source={proposalData?.description} />
          </MarkDownWrapper>
        </AutoColumn>
        <AutoColumn gap="md">
          <TYPE.mediumHeader fontWeight={600}>Proposer</TYPE.mediumHeader>
          <ProposerAddressLink
            href={proposalData?.proposer && chainId ? getEtherscanLink(chainId, proposalData?.proposer, 'address') : ''}
          >
            <ReactMarkdown source={proposalData?.proposer} />
          </ProposerAddressLink>
        </AutoColumn>
      </ProposalInfo>
    </PageWrapper>
  )
}
