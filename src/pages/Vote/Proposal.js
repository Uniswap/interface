import React, { useState } from 'react'
import styled from 'styled-components'
import CastVote from './CastVote'
import { Link } from 'react-router-dom'
import { AccountVoteInfo } from '../../models/AccountVoteInfo'
import { ProposalSummary } from '../../models/ProposalSummary'

const Main = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: black;
  padding: 20px 30px;
  border-bottom: 1px solid #e2e2e2;
  height: 100%;
  width: calc(100% - 60px);
`

const Wrapper = styled.div`
  height: 100%;
  width: 80%;
  display: inline-block;

 	@media (max-width: 450px) {
 		margin-bottom: 10px;
    width: 100%;
  }
`

const Info = styled.div`
	padding-top: 10px;
	font-size: 12px;
  font-weight: 600;
  color: #b7c3cc;

  ${({ active }) => active && `
      color: #327ccb;
  `}
`
const Status = styled.div`
  color: #67dc4d;
  text-align: center;
  background-color: #FFFFFF;
  border: 2px solid #67dc4d;
  border-radius: 5px;
  height: 15px;
  width: 75px;
  padding: 3px;
  display: inline-block;

  ${({ active }) => active && `
      border: 2px solid #327ccb;
      color: #327ccb;
  `}
`

const VoteButton = styled.div`
  height: 100%;
  width: 20%;
  display: inline-block;
  font-size: 15px;
  font-weight: 600;
  color: #b7c3cc;
  text-align: center;
  transition: opacity 0.2s ease-in-out;

  @media (max-width: 450px) {
    width: 100%;
  }

  ${({ cast }) => cast && `
    color: black;
    cursor: pointer;
    
    :hover {
      opacity: 0.7;
    }
  `}
`

const Extra = styled.div`
  font-weight: 700;
	padding-left: 7px;
	display: inline-block;
`

const link = {
  textDecoration: 'none',
  color: 'black',
  cursor: 'pointer'
}

export default function Proposal(props) {
  const proposal = props.proposal
  const availableVotes = ['Vote', 'For', 'Against', 'No Vote']
  const mod = (b, e) => availableVotes.slice(b, e)

  let initialVoteStatus
  if (!props.walletAddress) {
    initialVoteStatus = null
  } else if (
    proposal.proposalStatus === ProposalSummary.statuses.ACTIVE &&
    (proposal.account?.voteInfo?.voteStatus === AccountVoteInfo.statuses.NO_VOTE || !proposal.account?.voteInfo)
  ) {
    initialVoteStatus = AccountVoteInfo.statuses.VOTE
  } else {
    initialVoteStatus = proposal.account?.voteInfo?.voteStatus || AccountVoteInfo.statuses.NO_VOTE
  }
  const [voteStatus, setVoteStatus] = useState(initialVoteStatus)

  const initialIsCastedStatus = proposal.proposalStatus === ProposalSummary.statuses.ACTIVE &&
    !proposal.account?.voteInfo?.voteStatus &&
    proposal.account?.voteInfo?.voteStatus !== AccountVoteInfo.statuses.NO_VOTE
  const [isCasted, setCast] = useState(initialIsCastedStatus)
  const [showCastDialogue, setShowCastDialogue] = useState(false)

  const handleClick = (e) => {
    if (mod(1, 3).includes(e)) {
      setVoteStatus(e)
      setCast(false)
    }
    setShowCastDialogue(false)
  }


  return (
    <Main>
      <Wrapper>
        <Link to={`/vote/${proposal.proposalId}`} style={link}>
          {proposal.title}
        </Link>
        <Info active={proposal.proposalStatus}>
          <Status active={proposal.proposalStatus}>
            {proposal.proposalStatusFormatted()}
          </Status>
          <Extra>
            {proposal.proposalId} &#8226; {proposal.mostRecentDateText()}
          </Extra>
        </Info>
      </Wrapper>
      <VoteButton onClick={() => setShowCastDialogue(isCasted)} cast={isCasted}>
        {AccountVoteInfo.toFormattedVoteString(voteStatus)}
      </VoteButton>
      {showCastDialogue ?
        <CastVote
          proposal={proposal}
          timestamp={proposal.mostRecentDateText()}
          onChange={e => handleClick(e)}
          vote={(v) => setVoteStatus(v)}/>
        : <div/>
      }
    </Main>
  )
}
