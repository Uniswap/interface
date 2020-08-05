import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import CastVoteDialogue from './CastVoteDialogue'
import { Link, Redirect, useParams } from 'react-router-dom'
import { ProposalDetails } from '../../models/ProposalDetails'
import { useWeb3React } from '../../hooks'
import { amountFormatter } from '../../utils'
import { ReactComponent as ExternalLink } from '../../assets/svg/ExternalLink.svg'
import { ProposalSummary } from '../../models/ProposalSummary'
import { AccountProposalVoteInfo } from '../../models/AccountProposalVoteInfo'
import { useAllTransactions } from '../../contexts/Transactions'
import { Spinner } from '../../theme'

const Main = styled.div`
  width: 60vw;
	overflow-y: scroll;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  ::-webkit-scrollbar { /* Hide scrollbar for Chrome, Safari and Opera */
    display: none;
  }

  @media (max-width: 1000px) {
    top: 140px;
    width: 80vw;
    height: calc(100vh - 200px);
  }

  @media (max-width: 800px) {
    width: 90vw;
  }
`

const link = {
  textDecoration: 'none',
  color: '#808080',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: '15px',
  marginLeft: '10px'
}

const Wrapper = styled.div`
	margin-top: 20px;
	margin-left: 10px;
	display: inline-block;
`

const Proposal = styled.div`
  font-size: 20px;
  color: black;
  font-weight: 600;
`

const Info = styled.div`
	padding-top: 10px;
	font-size: 12px;
  font-weight: 600;
  color: #b7c3cc;

  ${({ active }) => active && `
    color: #4487CE;
  `}
`
const Status = styled.div`
  color: #2fdaa5;
  text-align: center;
  background-color: #FFFFFF;
  border: 2px solid #2fdaa5;
  border-radius: 5px;
  height: 15px;
  width: 75px;
  padding: 3px;
  display: inline-block;

  ${({ active }) => active && `
    border: 2px solid #4487CE;
		color: #4487CE;
  `}
`

const Extra = styled.div`
  font-weight: 700;
	padding-left: 7px;
	display: inline-block;
`

const Body = styled.div`
  width: 100%;
  margin-top: 20px;
`

const Card = styled.div`
  background-color: #FFFFFF;
  ${({ width }) => `
    width: calc(${width}% - 20px);
  `}
  border-radius: 5px;
  margin: 10px;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  color: black;
  display: inline-block;
  vertical-align: top;

  @media (max-width: 767px) {
    width: calc(100% - 20px);
  }
`

const Title = styled.div`  
  font-size: 28px;
  font-weight: 300;
  color: #0a2a5a;
  padding: 20px 0 10px;
  margin: 0 30px;
  
  @media (max-width: 800px) {
    font-size: 23px;
  }
`

const Bar = styled.div`
	height: 4px;
	width: 100%;
	border-radius: 2px;
	margin-top: 10px;
	background-color: #e2e2e2;
`

const Color = styled.div`
	height: 100%;
	border-radius: 2px;

	${({ color }) => `
    background-color: ${color}
  `}
  
  ${({ isWinning }) => isWinning ? `
    width: 100%;
  ` : `
    width: 50%;
  `}
`
const Addresses = styled.div`
	width: 100%;
`

const AddressTitle = styled.div`
	padding: 20px 30px;
  border-bottom: 1px solid #e2e2e2;
  font-size: 13px;
 	font-weight: 700;
 	color: #b0bdc5;
`

const VotesTitle = styled.div`
	float: right;
 	display: inline;
`

const Address = styled.div`
	padding: 20px 30px;
  border-bottom: 1px solid #e2e2e2;
  font-size: 15px;
 	font-weight: 600;
 	color: #b0bdc5;

 	${({ active }) => active && `
    color: black;
  `}
`
const Votes = styled.div`
	float: right;
 	display: inline;
`
const View = styled.div`
	padding: 20px 30px;
	text-align: center;
  font-size: 13px;
 	font-weight: 700;
 	color: #b0bdc5;
 	cursor: pointer;
 	transition: opacity 0.2s ease-in-out;

 	${({ active }) => active && `
    color: black;
  `}
  
  :hover {
    opacity: 0.7;
  }
`

const NoVoters = styled.div`
	padding: 20px 30px;
	text-align: center;
  font-size: 16px;
 	font-weight: 700;
 	color: #b0bdc5;
`

const Description = styled.div`
	margin: 20px 30px 25px;
	font-size: 13px;
	font-weight: 600;
	line-height: 1.4;
`


const HistoryWrapper = styled.div`
	margin: 20px 30px 25px;
`

const History = styled.div`
	margin-bottom: 15px;
`

const Check = styled.div`
	border-radius: 50%;
	height: 20px;
	width: 20px;
	background-color: #b0bdc5;
	color: #FFFFFF;
	font-weight: 700;
	font-size: 18px;
	padding: 2px 1px 3px 4px;
	display: inline-block;
	vertical-align: middle;

	${({ active }) => active && `
    background-color: #4487CE;
  `}
`

const HistoryInfo = styled.div`
	display: inline-block;
	margin-left: 10px;
	font-weight: 600;
 	color: black;
  vertical-align: middle;
`

const HistoryTitle = styled.div`
	font-size: 13px;
	margin-bottom: 3px;
`

const HistoryDate = styled.div`
	font-size: 11px;
	color: #b0bdc5;
`

const Vote = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #0a2a5a;
	float: right; 
	margin-right: 10px;
	margin-top: 24px;
	margin-bottom: 16px;
  text-align: center;
  border: 2px solid #b7c3cc;
  border-radius: 5px;
  height: 18px;
  padding: 5px 10px;
  cursor: pointer;

  ${({ cast }) => cast && `
    color: black;
    cursor: pointer;
    border: 2px solid #0a2aa5a;
  `}
  ${({ display }) => display ? `
    display: inline-block;
  ` : `
    display: none;
  `}
`

const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
`

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 8px;
  margin-left: 30px;
`

const votes = [
	{
		title: 'For',
		val: 0,
		addresses: [
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			}
		],
		color: '#09b53d'
	},
	{
		title: 'Against',
		val: 0,
		addresses: [
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			},
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			},
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			},
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			},
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			},
		],
		color: '#d4001e'
	}
]
function isValidProposalId(proposalId) {
  return !Number.isNaN(Number.parseInt(proposalId))
}

async function getDetails(proposalId, walletAddress) {
  const baseUrl = 'https://api.defimoneymarket.com'
  return fetch(`${baseUrl}/v1/governance/proposals/${proposalId}`)
    .then(response => response.json())
    .then(response => !!response.data ? new ProposalDetails(response.data) : null)
    .then(proposal => {
      if (proposal && walletAddress) {
        return fetch(`${baseUrl}/v1/governance/proposals/${proposal.proposalId}/results/addresses/${walletAddress}`)
          .then(response => response.json())
          .then(response => proposal.withAccount(response.data))
      } else {
        return proposal
      }
    })
}

const CAST_VOTE = 'Vote'
const VOTE_CASTING = 'Vote casting'

export default function ProposalDetailsPage() {
  const [vote, setVote] = useState(CAST_VOTE)
  const [cast, setCast] = useState(true)
  const [showCast, changeShowCast] = useState(false)
  const [castHash, setCastHash] = useState('')

  const [topVotersAmount, setTopVotersAmount] = useState(3)

  const handleClick = (e) => {
    if (e) {
      setVote(e)
      setCast(false)
    }
    changeShowCast(false)
  }

  const { account } = useWeb3React()

  const [proposal, setProposal] = useState(ProposalDetails.prototype)

  const voteDetails = [
    {
      title: 'For',
      color: '#44d394'
    },
    {
      title: 'Against',
      color: '#df5e66'
    }
  ]

  const allTransactions = useAllTransactions()
  const pending = Object.keys(allTransactions).filter(hash => !allTransactions[hash].receipt)

  useEffect(() => {
    let subscriptionId
    if (Object.keys(pending).filter(hash => hash === castHash).length === 0) {
      // The transaction is confirmed
      subscriptionId = setTimeout(() => {
        setCastHash('')
      }, 7500)
    }

    return () => !!subscriptionId && clearInterval(subscriptionId)
  }, [castHash, pending])

  useEffect(() => {
    const perform = () => {
      getDetails(proposalId, account)
        .then(proposal => {
          if (proposal) {
            setProposal(proposal)
          } else {
            setProposal('BAD')
          }
        })
        .catch(error => {
          setProposal('BAD')
          console.error('Found error ', error)
        })
    }

    perform()
    const subscriptionId = setInterval(() => {
      perform()
    }, 15000)

    return () => clearInterval(subscriptionId)
  })

  const shorten = (a) => `${a.substring(0, 6)}...${a.substring(a.length - 4, a.length)}`
  const addressTitle = (l) => `${l} ${l === 1 ? 'Address' : 'Addresses'}`
  const showMoreTopVoters = (topVoters) => {
    console.log('showing more...')
  }

  const proposalId = useParams().proposal_id
  if (!isValidProposalId(proposalId) || proposal === 'BAD') {
    return <Redirect to={{ pathname: '/governance/proposals', state: { isBadPath: true } }}/>
  }

  voteDetails[0].votesBN = proposal?.votesForBN
  voteDetails[0].topVoters = proposal?.votersFor || []

  voteDetails[1].votesBN = proposal?.votesAgainstBN
  voteDetails[1].topVoters = proposal?.votersAgainst || []

  const displayCastVote = proposal?.proposalStatus === ProposalSummary.statuses.ACTIVE &&
    (proposal?.account?.voteInfo?.voteStatus === AccountProposalVoteInfo.statuses.NO_VOTE || !proposal?.account?.voteInfo?.voteStatus)

  return (
    <Main>
      <Link to={'/governance/proposals'} style={link}>
        &#8592; Overview
      </Link>
      <div>
        <Wrapper>
          <Proposal>
            {proposal?.title}
          </Proposal>
          <Info active={true}>
            <Status active={true}>
              {proposal?.proposalStatus}
            </Status>
            <Extra>
              {proposal?.proposalId} &#8226; {!!proposal ? proposal.mostRecentDateText() : undefined}
            </Extra>
          </Info>
        </Wrapper>
        {!!castHash ?
          <SpinnerWrapper/> :
          <Vote
            onClick={() => changeShowCast(cast)}
            display={displayCastVote}
            onVoteCasted={(hash) => setCastHash(hash)}
            cast={cast}>
            {vote}
          </Vote>
        }
      </div>
      <Body>
        {voteDetails.map(({ title, votesBN, topVoters, color }, index) => {
          return (
            <Card width={50} key={`vote-details-${color}`}>
              <Title>
                {title}:&nbsp;&nbsp;&nbsp;{amountFormatter(votesBN, 18, 2)}
                <Bar>
                  <Color color={color}
                         isWinning={!!votesBN && votesBN.gt(index === 0 ? voteDetails[1].votesBN : voteDetails[0].votesBN)}/>
                </Bar>
              </Title>
              <Addresses>
                <AddressTitle>
                  {addressTitle(topVoters.length)}
                  <VotesTitle>Votes</VotesTitle>
                </AddressTitle>
                {topVoters.length === 0 ? (
                  <NoVoters>No votes {title.toLowerCase()} the proposal have been cast</NoVoters>) : (<span/>)}
                {topVoters.map((topVoter) => {
                  return (
                    <Address active key={`voter-${topVoter.walletAddress}`}>
                      {shorten(topVoter.walletAddress)}
                      <Votes>
                        {amountFormatter(topVoter.voteInfo?.votesCastedBN)}
                      </Votes>
                    </Address>
                  )
                })}
              </Addresses>
              {topVoters.length > topVotersAmount ? (
                <View onClick={() => showMoreTopVoters(topVoters)}>
                  {'View More'}
                </View>
              ) : (<span/>)}
            </Card>
          )
        })}
      </Body>
      <Card width={60}>
        <Title>
          Details
        </Title>
        <Underline/>
        <Description>
          {proposal?.description}
        </Description>
      </Card>
      <Card width={40}>
        <Title>
          Proposal History
        </Title>
        <Underline/>
        <HistoryWrapper>
          {(proposal?.breadcrumbs || []).map((breadcrumb, index) =>
            <History key={`history-${index}`}>
              <Check active={index === (proposal?.breadcrumbs?.length - 1 || 0)}>
                &#10003;
              </Check>
              <HistoryInfo>
                {!!breadcrumb.transactionHash ? (
                  <HistoryTitle>
                    {breadcrumb.statusFormatted()}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <Link to={`https://etherscan.io/tx/${breadcrumb.transactionHash}`} target={'_blank'}>
                      <ExternalLink/>
                    </Link>
                  </HistoryTitle>
                ) : (
                  <HistoryTitle>
                    {breadcrumb.statusFormatted()}
                  </HistoryTitle>
                )}
                <HistoryDate>
                  {breadcrumb.timestampFormatted()}
                </HistoryDate>
              </HistoryInfo>
            </History>
          )}
        </HistoryWrapper>
      </Card>
      {!!castHash ?
        <SpinnerWrapper/> :
        <Vote
          onClick={() => changeShowCast(cast)}
          display={displayCastVote}
          onVoteCasted={(hash) => setCastHash(hash)}
          cast={cast}>
          {vote}
        </Vote>
      }
      {showCast ?
        <CastVoteDialogue
          proposal={proposal}
          timestamp={proposal.mostRecentDateText()}
          onChange={e => handleClick(e)}
          onVoteCasted={(hash) => {
            setCastHash(hash)
          }}/>
        : null
      }
    </Main>
  )
}