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
import { useProposalData, useUserVotes, useUserDelegatee, ProposalData } from '../../state/governance/hooks'
import { useTimestampFromBlock } from '../../hooks/useTimestampFromBlock'
import { DateTime } from 'luxon'
import ReactMarkdown from 'react-markdown'
import VoteModal from '../../components/vote/VoteModal'
import { TokenAmount, JSBI } from '@uniswap/sdk'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { UNI, ZERO_ADDRESS, PROPOSAL_LENGTH_IN_DAYS } from '../../constants'
import { isAddress, getEtherscanLink } from '../../utils'

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

export default function VotePage({
  match: {
    params: { id }
  }
}: RouteComponentProps<{ id: string }>) {
  const { account, chainId } = useActiveWeb3React()

  // get data for this specific proposal
  const proposalData: ProposalData | undefined = useProposalData(id)

  // update support based on button interactions
  const [support, setSupport] = useState<boolean>(true)

  // modal for casting votes
  const [showModal, setShowModal] = useState<boolean>(false)

  // get and format date from data
  const startTimestamp: number | undefined = useTimestampFromBlock(proposalData?.startBlock)
  const endDate: DateTime | undefined = startTimestamp
    ? DateTime.fromSeconds(startTimestamp).plus({ days: PROPOSAL_LENGTH_IN_DAYS })
    : undefined
  const now: DateTime = DateTime.local()

  // get total votes and format percentages for UI
  const totalVotes: number | undefined = proposalData ? proposalData.forCount + proposalData.againstCount : undefined
  const forPercentage: string =
    proposalData && totalVotes ? ((proposalData.forCount * 100) / totalVotes).toFixed(0) + '%' : '0%'
  const againstPercentage: string =
    proposalData && totalVotes ? ((proposalData.againstCount * 100) / totalVotes).toFixed(0) + '%' : '0%'

  // show delegation option if they have have a balance, have not delegated
  const availableVotes: TokenAmount | undefined = useUserVotes()
  const uniBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, chainId ? UNI[chainId] : undefined)
  const userDelegatee: string | undefined = useUserDelegatee()
  const showUnlockVoting = Boolean(
    uniBalance && JSBI.notEqual(uniBalance.raw, JSBI.BigInt(0)) && userDelegatee === ZERO_ADDRESS
  )

  // show links in propsoal details if content is an address
  const linkIfAddress = (content: string) => {
    if (isAddress(content) && chainId) {
      return <ExternalLink href={getEtherscanLink(chainId, content, 'address')}>{content}</ExternalLink>
    }
    return <span>{content}</span>
  }

  return (
    <PageWrapper gap="lg" justify="center">
      <VoteModal
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
        proposalId={proposalData?.id}
        support={support}
      />
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
                ? 'Voting ends approximately' + (endDate && endDate.toLocaleString(DateTime.DATETIME_FULL))
                : ''}
            </TYPE.main>
            {showUnlockVoting && endDate && endDate > now && (
              <ButtonPrimary
                style={{ width: 'fit-content' }}
                padding="8px"
                borderRadius="8px"
                onClick={() => setShowModal(true)}
              >
                Unlock Voting
              </ButtonPrimary>
            )}
          </RowBetween>
        </AutoColumn>
        {!showUnlockVoting &&
        availableVotes &&
        JSBI.greaterThan(availableVotes?.raw, JSBI.BigInt(0)) &&
        endDate &&
        endDate > now ? (
          <RowFixed style={{ width: '100%', gap: '12px' }}>
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              onClick={() => {
                setSupport(true)
                setShowModal(true)
              }}
            >
              Vote For
            </ButtonPrimary>
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              onClick={() => {
                setSupport(false)
                setShowModal(true)
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
          <TYPE.mediumHeader fontWeight={600}>Overview</TYPE.mediumHeader>
          <MarkDownWrapper>
            <ReactMarkdown source={proposalData?.description} />
          </MarkDownWrapper>
        </AutoColumn>
        <AutoColumn gap="md">
          <TYPE.mediumHeader fontWeight={600}>Proposer</TYPE.mediumHeader>
          <ExternalLink
            href={proposalData?.proposer && chainId ? getEtherscanLink(chainId, proposalData?.proposer, 'address') : ''}
          >
            <ReactMarkdown source={proposalData?.proposer} />
          </ExternalLink>
        </AutoColumn>
      </ProposalInfo>
    </PageWrapper>
  )
}
