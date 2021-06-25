import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import JSBI from 'jsbi'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactMarkdown from 'react-markdown'

import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ButtonPrimary } from '../../components/Button'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import { CardSection, DataCard } from '../../components/earn/styled'
import { RowBetween, RowFixed } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import DelegateModal from '../../components/vote/DelegateModal'
import VoteModal from '../../components/vote/VoteModal'
import {
  AVERAGE_BLOCK_TIME_IN_SECS,
  COMMON_CONTRACT_NAMES,
  DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
} from '../../constants/governance'
import { ZERO_ADDRESS } from '../../constants/misc'
import { UNI } from '../../constants/tokens'
import { useActiveWeb3React } from '../../hooks/web3'
import { ApplicationModal } from '../../state/application/actions'
import { useBlockNumber, useModalOpen, useToggleDelegateModal, useToggleVoteModal } from '../../state/application/hooks'
import {
  ProposalData,
  ProposalState,
  useProposalData,
  useUserDelegatee,
  useUserVotesAsOfBlock,
} from '../../state/governance/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, StyledInternalLink, TYPE } from '../../theme'
import { isAddress } from '../../utils'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ProposalStatus } from './styled'
import { t, Trans } from '@lingui/macro'

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
    params: { governorIndex, id },
  },
}: RouteComponentProps<{ governorIndex: string; id: string }>) {
  const { chainId, account } = useActiveWeb3React()

  // get data for this specific proposal
  const proposalData: ProposalData | undefined = useProposalData(Number.parseInt(governorIndex), id)

  // update support based on button interactions
  const [support, setSupport] = useState<boolean>(true)

  // modal for casting votes
  const showVoteModal = useModalOpen(ApplicationModal.VOTE)
  const toggleVoteModal = useToggleVoteModal()

  // toggle for showing delegation modal
  const showDelegateModal = useModalOpen(ApplicationModal.DELEGATE)
  const toggleDelegateModal = useToggleDelegateModal()

  // get and format date from data
  const currentTimestamp = useCurrentBlockTimestamp()
  const currentBlock = useBlockNumber()
  const endDate: DateTime | undefined =
    proposalData && currentTimestamp && currentBlock
      ? DateTime.fromSeconds(
          currentTimestamp
            .add(
              BigNumber.from(
                (chainId && AVERAGE_BLOCK_TIME_IN_SECS[chainId]) ?? DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS
              ).mul(BigNumber.from(proposalData.endBlock - currentBlock))
            )
            .toNumber()
        )
      : undefined
  const now: DateTime = DateTime.local()

  // get total votes and format percentages for UI
  const totalVotes: number | undefined = proposalData ? proposalData.forCount + proposalData.againstCount : undefined
  const forPercentage: string = t`${
    proposalData && totalVotes ? ((proposalData.forCount * 100) / totalVotes).toFixed(0) : '0'
  } %`
  const againstPercentage: string = t`${
    proposalData && totalVotes ? ((proposalData.againstCount * 100) / totalVotes).toFixed(0) : '0'
  } %`

  // only count available votes as of the proposal start block
  const availableVotes: CurrencyAmount<Token> | undefined = useUserVotesAsOfBlock(proposalData?.startBlock ?? undefined)

  // only show voting if user has > 0 votes at proposal start block and proposal is active,
  const showVotingButtons =
    availableVotes &&
    JSBI.greaterThan(availableVotes.quotient, JSBI.BigInt(0)) &&
    proposalData &&
    proposalData.status === ProposalState.Active

  const uniBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    chainId ? UNI[chainId] : undefined
  )
  const userDelegatee: string | undefined = useUserDelegatee()

  // in blurb link to home page if they are able to unlock
  const showLinkForUnlock = Boolean(
    uniBalance && JSBI.notEqual(uniBalance.quotient, JSBI.BigInt(0)) && userDelegatee === ZERO_ADDRESS
  )

  // show links in propsoal details if content is an address
  // if content is contract with common name, replace address with common name
  const linkIfAddress = (content: string) => {
    if (isAddress(content) && chainId) {
      const commonName = COMMON_CONTRACT_NAMES[chainId]?.[content] ?? content
      return (
        <ExternalLink href={getExplorerLink(chainId, content, ExplorerDataType.ADDRESS)}>{commonName}</ExternalLink>
      )
    }
    return <span>{content}</span>
  }

  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <VoteModal isOpen={showVoteModal} onDismiss={toggleVoteModal} proposalId={proposalData?.id} support={support} />
        <DelegateModal isOpen={showDelegateModal} onDismiss={toggleDelegateModal} title={<Trans>Unlock Votes</Trans>} />
        <ProposalInfo gap="lg" justify="start">
          <RowBetween style={{ width: '100%' }}>
            <ArrowWrapper to="/vote">
              <Trans>
                <ArrowLeft size={20} /> All Proposals
              </Trans>
            </ArrowWrapper>
            {proposalData && (
              <ProposalStatus status={proposalData.status}>{ProposalState[proposalData.status]}</ProposalStatus>
            )}
          </RowBetween>
          <AutoColumn gap="10px" style={{ width: '100%' }}>
            <TYPE.largeHeader style={{ marginBottom: '.5rem' }}>{proposalData?.title}</TYPE.largeHeader>
            <RowBetween>
              <TYPE.main>
                {endDate && endDate < now ? (
                  <Trans>Voting ended {endDate && endDate.toLocaleString(DateTime.DATETIME_FULL)}</Trans>
                ) : proposalData ? (
                  <Trans>Voting ends approximately {endDate && endDate.toLocaleString(DateTime.DATETIME_FULL)}</Trans>
                ) : (
                  ''
                )}
              </TYPE.main>
            </RowBetween>
            {proposalData && proposalData.status === ProposalState.Active && !showVotingButtons && (
              <GreyCard>
                <TYPE.black>
                  <Trans>
                    Only UNI votes that were self delegated or delegated to another address before block{' '}
                    {proposalData.startBlock} are eligible for voting.{' '}
                  </Trans>
                  {showLinkForUnlock && (
                    <span>
                      <Trans>
                        <StyledInternalLink to="/vote">Unlock voting</StyledInternalLink> to prepare for the next
                        proposal.
                      </Trans>
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
                <Trans>Vote For</Trans>
              </ButtonPrimary>
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                onClick={() => {
                  setSupport(false)
                  toggleVoteModal()
                }}
              >
                <Trans>Vote Against</Trans>
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
                    <TYPE.black fontWeight={600}>
                      <Trans>For</Trans>
                    </TYPE.black>
                    <TYPE.black fontWeight={600}>
                      {proposalData?.forCount?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                    <TYPE.black fontWeight={600}>
                      <Trans>Against</Trans>
                    </TYPE.black>
                    <TYPE.black fontWeight={600}>
                      {proposalData?.againstCount?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
            <TYPE.mediumHeader fontWeight={600}>
              <Trans>Details</Trans>
            </TYPE.mediumHeader>
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
            <TYPE.mediumHeader fontWeight={600}>
              <Trans>Description</Trans>
            </TYPE.mediumHeader>
            <MarkDownWrapper>
              <ReactMarkdown source={proposalData?.description} />
            </MarkDownWrapper>
          </AutoColumn>
          <AutoColumn gap="md">
            <TYPE.mediumHeader fontWeight={600}>
              <Trans>Proposer</Trans>
            </TYPE.mediumHeader>
            <ProposerAddressLink
              href={
                proposalData?.proposer && chainId
                  ? getExplorerLink(chainId, proposalData?.proposer, ExplorerDataType.ADDRESS)
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
  )
}
