import { useCelo, useConnectedSigner } from '@celo/react-celo'
import { ChainId, JSBI, TokenAmount } from '@ubeswap/sdk'
import { StyledControlButton } from 'components/LimitOrderHistory/LimitOrderHistoryItem'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { RomulusDelegate__factory } from 'generated'
import { TypedEvent } from 'generated/common'
import { ProposalState, Support, useProposal } from 'hooks/romulus/useProposal'
import { useVoteCasts } from 'hooks/romulus/useVoteCasts'
import { useVotingTokens } from 'hooks/romulus/useVotingTokens'
import { useLatestBlockNumber } from 'hooks/useLatestBlockNumber'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader, PlayCircle, XCircle } from 'react-feather'
import { Box, Button, Card, Link, Text } from 'rebass'
import { WrappedTokenInfo } from 'state/lists/hooks'
import styled from 'styled-components'
import { humanFriendlyWei } from 'utils/number'

import { BIG_INT_ZERO, KNOWN_ADDRESSES, ubeGovernanceAddresses } from '../../../constants'

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

const ube = new WrappedTokenInfo(
  {
    address: '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec',
    name: 'Ubeswap Governance Token',
    symbol: 'UBE',
    chainId: 42220,
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_UBE.png',
  },
  []
)

export const ProposalCard: React.FC<IProps> = ({ proposalEvent, clickable, showId, showAuthor, outline = true }) => {
  const { network } = useCelo()
  const mountedRef = useRef(true)
  const [proposalContent, setProposalContent] = useState<ProposalContent>({
    stateStr: '',
    stateColor: '#909090',
    votingTimeColor: '#909090',
    timeText: undefined,
  })
  const signer = useConnectedSigner()
  const romulusAddress = ubeGovernanceAddresses[network.chainId as ChainId]
  const [latestBlockNumber] = useLatestBlockNumber()
  const { proposal, proposalState } = useProposal((romulusAddress as string) || '', proposalEvent.args.id)
  const { votingPower, releaseVotingPower } = useVotingTokens(proposalEvent.args.startBlock)
  const voteCasts = useVoteCasts(romulusAddress || '')
  const vote = voteCasts?.[proposalEvent.args.id.toString()]
  const zeroAmount = new TokenAmount(ube, BIG_INT_ZERO)
  const totalVotingPower = votingPower?.add(releaseVotingPower ?? zeroAmount)
  const onCancelClick = React.useCallback(async () => {
    if (!romulusAddress || !mountedRef.current) {
      return
    }
    if (!signer) {
      throw new Error('no signer')
    }
    const romulus = RomulusDelegate__factory.connect(romulusAddress, signer)
    try {
      await romulus.cancel(proposalEvent.args.id)
    } catch (e) {
      console.warn(e)
      alert(e)
    }
  }, [signer, proposalEvent.args.id, romulusAddress, mountedRef])

  const castVote = React.useCallback(
    async (support: Support) => {
      if (!romulusAddress || !mountedRef.current) {
        return
      }
      if (!signer) {
        throw new Error('no signer')
      }
      const romulus = RomulusDelegate__factory.connect(romulusAddress, signer)
      await romulus.castVote(proposalEvent.args.id, support)
    },
    [signer, proposalEvent.args.id, romulusAddress, mountedRef]
  )

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const statusSymbol = useRef<JSX.Element>(<XCircle size={20} color={'#909090'} />)
  useEffect(() => {
    if (!mountedRef.current) {
      return
    }
    const secondsTilStart = (latestBlockNumber - Number(proposalEvent.args.startBlock.toString())) * SECONDS_PER_BLOCK
    const secondsTilEnd = (Number(proposalEvent.args.endBlock.toString()) - latestBlockNumber) * SECONDS_PER_BLOCK
    switch (proposalState) {
      case ProposalState.PENDING:
        setProposalContent({
          stateStr: 'Pending',
          timeText: `${moment.duration(secondsTilStart, 'seconds').humanize()} until voting begins`,
          stateColor: '#F3841E',
          votingTimeColor: '#F3841E',
        })
        statusSymbol.current = <Loader size={20} color={'#F3841E'} />
        break
      case ProposalState.ACTIVE:
        setProposalContent({
          stateStr: 'Active',
          timeText: `${moment.duration(secondsTilEnd, 'seconds').humanize()} until voting ends`,
          stateColor: '#35D07F',
          votingTimeColor: '#35D07F',
        })
        statusSymbol.current = <PlayCircle size={20} color={'#35D07F'} />
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
        statusSymbol.current = <CheckCircle size={20} color={'#35D07F'} />
        break
      case ProposalState.QUEUED:
        setProposalContent({
          stateStr: 'Queued',
          timeText: 'Voting Ended',
          votingTimeColor: '#909090',
          stateColor: '#909090',
        })
        statusSymbol.current = <CheckCircle size={20} color={'#909090'} />
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
        statusSymbol.current = <CheckCircle size={20} color={'#35D07F'} />
        break
    }
  }, [latestBlockNumber, proposalEvent.args.endBlock, proposalEvent.args.startBlock, proposalState])

  const voteContent = useRef<JSX.Element | undefined>(undefined)
  useEffect(() => {
    if (proposalState === ProposalState.CANCELED) {
      voteContent.current = undefined
    } else if (proposalEvent.args.startBlock.gt(latestBlockNumber)) {
      voteContent.current = <Text>Voting has not started yet.</Text>
    } else if (totalVotingPower && JSBI.lessThanOrEqual(totalVotingPower.raw, zeroAmount.raw)) {
      voteContent.current = <Text>You have no voting power for this proposal.</Text>
    } else if (vote) {
      let supportText = <></>
      if (vote.args.support === Support.FOR) {
        supportText = (
          <>
            <Text>for</Text> votes
          </>
        )
      } else if (vote.args.support === Support.ABSTAIN) {
        supportText = (
          <>
            <Text>abstained</Text> votes
          </>
        )
      } else if (vote.args.support === Support.AGAINST) {
        supportText = (
          <>
            <Text>against</Text> votes
          </>
        )
      }
      voteContent.current = (
        <Text>
          You made {humanFriendlyWei(vote.args.votes.toString())} {supportText}.
        </Text>
      )
    } else if (proposalEvent.args.endBlock.lt(latestBlockNumber)) {
      if (proposalState === ProposalState.ACTIVE || proposalState === ProposalState.PENDING) {
        voteContent.current = <Text>Voting has already ended.</Text>
      } else {
        voteContent.current = undefined
      }
    } else {
      voteContent.current = (
        <>
          <Button onClick={() => castVote(Support.FOR)} disabled={!(proposalState === ProposalState.ACTIVE)} mx={2}>
            Vote For
          </Button>
          <Button onClick={() => castVote(Support.AGAINST)} disabled={!(proposalState === ProposalState.ACTIVE)} mx={2}>
            Vote Against
          </Button>
        </>
      )
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
    zeroAmount.raw,
  ])

  if (!romulusAddress) {
    return <div>Invalid romulus address</div>
  }

  return (
    <ClickableCard clickable={clickable} outline={outline}>
      <InformationWrapper fontWeight={400} gap={6} style={{ alignItems: 'center' }}>
        <Text fontWeight={600} fontSize={16}>
          {showId
            ? proposalEvent.args.id.toString().length === 1
              ? `Proposal 00${proposalEvent.args.id.toString()}`
              : `Proposal 0${proposalEvent.args.id.toString()}`
            : ''}
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
            <Text>{humanFriendlyWei(proposal?.forVotes.toString()).split('.')[0]}</Text>
          </InformationWrapper>
          <InformationWrapper fontWeight={400} gap={4}>
            <Text>Against Votes </Text>
            <Text>{humanFriendlyWei(proposal?.againstVotes.toString()).split('.')[0]}</Text>
          </InformationWrapper>
        </>
      )}
      {voteContent.current && <InformationWrapper gap={8}>{voteContent.current}</InformationWrapper>}
      {proposalContent.timeText && (
        <InformationWrapper gap={4}>
          <VotingTimeText votingTimeColor={proposalContent.votingTimeColor}>{proposalContent.timeText}</VotingTimeText>
          {proposalState == ProposalState.ACTIVE && (
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
