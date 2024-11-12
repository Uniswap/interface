import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ButtonOutlined } from 'components/Button'
import { BIG_INT_ZERO, KNOWN_ADDRESSES } from 'constants/misc'
import { UBE } from 'constants/tokens'
import { getAddress } from 'ethers/lib/utils'
import { useRomulusDelegateContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { ProposalState, Support, useProposal } from 'pages/Stake/hooks/romulus/useProposal'
import { useVoteCasts } from 'pages/Stake/hooks/romulus/useVoteCasts'
import { useVotingTokens } from 'pages/Stake/hooks/romulus/useVotingTokens'
import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader, PlayCircle, XCircle } from 'react-feather'
import { Box, Card, Link, Text } from 'rebass'
import styled from 'styled-components'
import { TypedEvent } from 'uniswap/src/abis/types/common'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const StyledControlButton = styled.button`
  height: 24px;
  background-color: ${({ theme }) => theme.red1};
  border: 1px solid ${({ theme }) => theme.red2};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-left: 7rem;
  margin-right: 2rem;
  color: white;
  :hover {
    border: 1px solid ${({ theme }) => theme.red3};
    box-shadow: 0px 0px 10px 0px ${({ theme }) => theme.red3};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.red3};
    box-shadow: 0px 0px 10px 0px ${({ theme }) => theme.red3};
    outline: none;
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
    margin-left: 0.4rem;
    margin-right: 0.1rem;
  `};
`

const ButtonError = styled(ButtonOutlined)`
  border-color: ${({ theme }) => theme.critical};
  color: ${({ theme }) => theme.critical};
`
const ButtonSuccess = styled(ButtonOutlined)`
  border-color: ${({ theme }) => theme.success};
  color: ${({ theme }) => theme.success};
`

export const formatDuration = (durationSeconds: number) => {
  const seconds = Math.floor(durationSeconds)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)

  if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  if (minutes > 1) return `${minutes} minutes`
  else return `${seconds} second${seconds > 1 ? 's' : ''}`
}

export const InformationWrapper = styled.div<{ fontWeight?: number; fontSize?: number; gap?: number }>`
  display: flex;
  justify-content: space-between;
  font-size: ${({ fontSize }) => (fontSize ? `${fontSize}px` : '14px')};
  font-weight: ${({ fontWeight }) => fontWeight ?? 500};
  padding: ${({ gap }) => (gap ? `${gap}px 0` : '0')};
`

const ProposalStatusContainer = styled(Box)<{
  stateColor: string
}>`
  font-size: 0.825rem;
  color: ${({ stateColor }) => stateColor};
  border-radius: 12px;
  width: 120px;
  padding: 0.25rem;
  border: 1px solid ${({ stateColor }) => stateColor};
  display: flex;
  align-items: center;
  justify-content: center;
`

const VotingTimeText = styled(Text)<{
  votingTimeColor: string
}>`
  font-weight: 400;
  border-radius: 8px;
  background-color: ${({ votingTimeColor }) => votingTimeColor};
  font-size: 12px;
  padding: 8px;
`

const ProposalDetailLink = styled(Text)`
  font-weight: 500;
  font-size: 12px;
  padding: 8px;
  width: 100%;
  text-align: center;
  padding: 4px;
`

const ClickableCard = styled(Card)<{
  clickable: boolean
  outline: boolean
}>`
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  font-size: 12px;
  font-weight: 400;
  padding: 8px 16px;
  border: ${({ theme, outline }) => (outline ? `1px solid ${theme.primary5}` : 'unset')};
  border-radius: 8px;
  &:hover {
    ${({ clickable, theme }) => (clickable ? `box-shadow: 0px 2px 10px 1px ${theme.primary5};` : '')}
`

interface Props {
  value: string | null
  truncate?: boolean
  label?: string
  link?: boolean
}

export const Address: React.FC<Props> = ({ value, truncate, label, link = true }: Props) => {
  if (!value) {
    return <>--</>
  }
  const fmt = getAddress(value)

  const text =
    label ??
    KNOWN_ADDRESSES[fmt]?.name ??
    (truncate ? `${fmt.slice(0, 6)}...${fmt.slice(fmt.length - 5, fmt.length)}` : fmt)
  if (!link) {
    return <>{text}</>
  }

  return (
    <Link
      href={`https://explorer.celo.org/address/${fmt.toLowerCase()}/transactions`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', color: 'rgb(149, 128, 255)' }}
    >
      {text}
    </Link>
  )
}

interface IProps {
  proposalEvent: TypedEvent<
    [BigNumber, string, string[], BigNumber[], string[], string[], BigNumber, BigNumber, string] & {
      id: BigNumber
      proposer: string
      targets: string[]
      values: BigNumber[]
      signatures: string[]
      calldatas: string[]
      startBlock: BigNumber
      endBlock: BigNumber
      description: string
    }
  >
  clickable: boolean
  showId: boolean
  showAuthor: boolean
  outline?: boolean
}

interface ProposalContent {
  stateStr: string
  stateColor: string
  votingTimeColor: string
  timeText: string | undefined
}

const SECONDS_PER_BLOCK = 5

export const ProposalCard: React.FC<IProps> = ({ proposalEvent, clickable, showId, showAuthor, outline = true }) => {
  const { chainId, provider } = useWeb3React()
  const signer = provider?.getSigner()
  const ube = chainId ? UBE[chainId] : undefined
  const mountedRef = useRef(true)
  const { formatEther } = useFormatter()
  const [proposalContent, setProposalContent] = useState<ProposalContent>({
    stateStr: '',
    stateColor: '#909090',
    votingTimeColor: '#909090',
    timeText: undefined,
  })
  const latestBlockNumber = useBlockNumber()
  const isNewContract = proposalEvent.blockNumber > 25_000_000
  const romulusContract = useRomulusDelegateContract()
  const { proposal, proposalState } = useProposal(proposalEvent.args.id, isNewContract)
  const { votingPower, releaseVotingPower } = useVotingTokens(isNewContract ? proposalEvent.args.startBlock : 0)
  const voteCasts = useVoteCasts()
  const vote = voteCasts?.[proposalEvent.args.id.toString()]
  const zeroAmount = ube ? CurrencyAmount.fromRawAmount(ube, BIG_INT_ZERO) : null
  const totalVotingPower = zeroAmount ? votingPower?.add(releaseVotingPower ?? zeroAmount) : null
  const onCancelClick = React.useCallback(async () => {
    //if (!romulusContract || !mountedRef.current) {
    if (!romulusContract) {
      return
    }
    try {
      await romulusContract.cancel(proposalEvent.args.id)
    } catch (e) {
      console.warn(e)
      alert(e)
    }
  }, [romulusContract, proposalEvent.args.id])

  const castVote = React.useCallback(
    async (support: Support) => {
      // if (!romulusContract || !mountedRef.current) {
      if (!romulusContract) {
        return
      }
      if (!signer) {
        throw new Error('no signer')
      }
      await romulusContract.castVote(proposalEvent.args.id, support)
    },
    [signer, proposalEvent.args.id, romulusContract]
  )

  useEffect(() => {
    return () => {
      if (latestBlockNumber) {
        mountedRef.current = false
      }
    }
  }, [latestBlockNumber])

  const statusSymbol = useRef<JSX.Element>(<XCircle size={20} color="#909090" />)
  useEffect(() => {
    // if (!mountedRef.current || !latestBlockNumber) {
    if (!latestBlockNumber) {
      return
    }
    const secondsTilStart = (latestBlockNumber - Number(proposalEvent.args.startBlock.toString())) * SECONDS_PER_BLOCK
    const secondsTilEnd = (Number(proposalEvent.args.endBlock.toString()) - latestBlockNumber) * SECONDS_PER_BLOCK
    switch (proposalState) {
      case ProposalState.PENDING:
        setProposalContent({
          stateStr: 'Pending',
          timeText: `${formatDuration(secondsTilStart)} until voting begins`,
          stateColor: '#F3841E',
          votingTimeColor: '#F3841E',
        })
        statusSymbol.current = <Loader size={20} color="#F3841E" />
        break
      case ProposalState.ACTIVE:
        setProposalContent({
          stateStr: 'Active',
          timeText: `${formatDuration(secondsTilEnd)} until voting ends`,
          stateColor: '#35D07F',
          votingTimeColor: '#35D07F',
        })
        statusSymbol.current = <PlayCircle size={20} color="#35D07F" />
        break
      case ProposalState.CANCELED:
        setProposalContent({
          stateStr: 'Canceled',
          timeText: 'Voting Ended',
          stateColor: '#909090',
          votingTimeColor: '#909090',
        })
        break
      case ProposalState.DEFEATED:
        setProposalContent({
          stateStr: 'Defeated',
          timeText: 'Voting Ended',
          stateColor: '#909090',
          votingTimeColor: '#909090',
        })
        break
      case ProposalState.SUCCEEDED:
        setProposalContent({
          stateStr: 'Succeeded',
          timeText: 'Voting Ended',
          stateColor: '#35D07F',
          votingTimeColor: '#909090',
        })
        statusSymbol.current = <CheckCircle size={20} color="#35D07F" />
        break
      case ProposalState.QUEUED:
        setProposalContent({
          stateStr: 'Queued',
          timeText: 'Voting Ended',
          votingTimeColor: '#909090',
          stateColor: '#909090',
        })
        statusSymbol.current = <CheckCircle size={20} color="#909090" />
        break
      case ProposalState.EXPIRED:
        setProposalContent({
          stateStr: 'Expired',
          timeText: 'Voting Ended',
          stateColor: '#909090',
          votingTimeColor: '#909090',
        })
        break
      case ProposalState.EXECUTED:
        setProposalContent({
          stateStr: 'Executed',
          timeText: 'Voting Ended',
          stateColor: '#35D07F',
          votingTimeColor: '#909090',
        })
        statusSymbol.current = <CheckCircle size={20} color="#35D07F" />
        break
    }
  }, [latestBlockNumber, proposalEvent.args.endBlock, proposalEvent.args.startBlock, proposalState])

  const voteContent = useRef<JSX.Element | undefined>(undefined)
  useEffect(() => {
    if (!latestBlockNumber) {
      return
    }
    if (proposalState === ProposalState.CANCELED) {
      voteContent.current = undefined
    } else if (proposalEvent.args.startBlock.gt(latestBlockNumber)) {
      voteContent.current = <Text>Voting has not started yet.</Text>
    } else if (totalVotingPower && zeroAmount && JSBI.lessThanOrEqual(totalVotingPower.quotient, zeroAmount.quotient)) {
      voteContent.current = <Text>You have no voting power for this proposal.</Text>
    } else if (vote) {
      let supportText = ''
      if (vote.args.support === Support.FOR) {
        supportText = ' for votes'
      } else if (vote.args.support === Support.ABSTAIN) {
        supportText = ' absteined votes'
      } else if (vote.args.support === Support.AGAINST) {
        supportText = ' against votes'
      }
      voteContent.current = (
        <Text display="flex">
          You made {formatEther({ input: vote.args.votes.toString(), type: NumberType.TokenTx })} {supportText}.
        </Text>
      )
    } else if (proposalEvent.args.endBlock.lt(latestBlockNumber)) {
      if (proposalState === ProposalState.ACTIVE || proposalState === ProposalState.PENDING) {
        voteContent.current = <Text>Voting has already ended.</Text>
      } else {
        voteContent.current = undefined
      }
    } else if (clickable == false) {
      voteContent.current = (
        <>
          <ButtonSuccess
            padding="6px"
            $borderRadius="6px"
            onClick={() => castVote(Support.FOR)}
            disabled={!(proposalState === ProposalState.ACTIVE)}
            mx={2}
          >
            Vote For
          </ButtonSuccess>
          <ButtonError
            padding="6px"
            $borderRadius="6px"
            onClick={() => castVote(Support.AGAINST)}
            disabled={!(proposalState === ProposalState.ACTIVE)}
            mx={2}
          >
            Vote Against
          </ButtonError>
        </>
      )
    } else {
      voteContent.current = undefined
    }
  }, [
    castVote,
    latestBlockNumber,
    proposalEvent.args.endBlock,
    proposalEvent.args.startBlock,
    proposalState,
    releaseVotingPower,
    totalVotingPower,
    vote,
    votingPower,
    zeroAmount,
    formatEther,
    clickable,
  ])

  if (!romulusContract) {
    return <div>Invalid romulus address</div>
  }

  const idToShow = isNewContract ? proposalEvent.args.id.add(15).toString() : proposalEvent.args.id.toString()

  return (
    <ClickableCard clickable={clickable} outline={outline}>
      <InformationWrapper fontWeight={400} gap={6} style={{ alignItems: 'center' }}>
        <Text fontWeight={600} fontSize={16}>
          {showId ? (idToShow.length === 1 ? `Proposal 00${idToShow}` : `Proposal 0${idToShow}`) : ''}
        </Text>
        <ProposalStatusContainer stateColor={proposalContent.stateColor}>
          {statusSymbol.current}
          <Text>&nbsp;{proposalContent.stateStr}</Text>
        </ProposalStatusContainer>
      </InformationWrapper>
      {showAuthor ? (
        <InformationWrapper fontWeight={400} gap={4}>
          <Text>Proposal Author</Text>
          <Address value={proposalEvent.args.proposer} truncate />
        </InformationWrapper>
      ) : (
        <InformationWrapper fontWeight={400} gap={4}>
          <Text mr={2}>Proposed by</Text>
          <Address value={proposalEvent.args.proposer} truncate />
        </InformationWrapper>
      )}
      {proposal && (
        <>
          <InformationWrapper fontWeight={400} gap={4}>
            <Text>For Votes</Text>
            <Text>{formatEther({ input: proposal?.forVotes.toString(), type: NumberType.TokenTx }).split('.')[0]}</Text>
          </InformationWrapper>
          <InformationWrapper fontWeight={400} gap={4}>
            <Text>Against Votes </Text>
            <Text>
              {formatEther({ input: proposal?.againstVotes.toString(), type: NumberType.TokenTx }).split('.')[0]}
            </Text>
          </InformationWrapper>
        </>
      )}
      {voteContent.current && <InformationWrapper gap={8}>{voteContent.current}</InformationWrapper>}
      {proposalContent.timeText && (
        <InformationWrapper gap={4}>
          <VotingTimeText votingTimeColor={proposalContent.votingTimeColor}>{proposalContent.timeText}</VotingTimeText>
          {proposalState == ProposalState.ACTIVE && clickable == false && (
            <StyledControlButton
              style={{ margin: 'unset' }}
              onClick={(e) => {
                e.preventDefault()
                onCancelClick()
              }}
            >
              Cancel
            </StyledControlButton>
          )}
        </InformationWrapper>
      )}
      {clickable && <ProposalDetailLink>Proposal Details &gt;&gt;</ProposalDetailLink>}
    </ClickableCard>
  )
}
