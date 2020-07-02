import React, { useState } from 'react';
import Proposal from './Proposal'
import styled from 'styled-components'

const Main = styled.div`
  height: calc(100vh - 200px);
  width: 80vw;
  position: absolute;
  top: 140px;
  left: 0;
	right: 0;
	margin-left: auto;
	margin-right: auto;
`

const Votes = styled.div`
  text-align: center;
  height: 80px;
  color: black;
  font-weight: 600;
`
const VoteTitle = styled.div`
  font-size: 14px;
`
const Amount = styled.div`
  font-size: 25px;
`
const Voting = styled.div`
  height: calc(100% - 100px);
  width: 100%;
`

const VotingWallet = styled.div`
  background-color: #FFFFFF;
  width: calc(35% - 20px);
  height: 80%;
  border-radius: 5px;
  margin: 10px;
  margin-bottom: 1rem;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  color: black;
  display: inline-block;
  vertical-align: top;
`
const GovernanceProposals = styled.div`
  background-color: #FFFFFF;
  width: calc(65% - 20px);;
  height: 100%;
  margin: 10px;
  border-radius: 5px;
  margin-bottom: 1rem;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  color: black;
  display: inline-block;
  vertical-align: top;
`

const Title = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: black;
  padding: 20px 30px;
  border-bottom: 1px solid #DCDCDC;
`

const Proposals = styled.div`
  height: calc(100% - 62px);
  overflow-y: scroll;
`

const Balance = styled.div`
  padding: 20px 30px;
  border-bottom: 1px solid #DCDCDC;
`

const DMGTitle = styled.div`
	font-size: 15px;
  font-weight: 700;
  color: #b7c3cc;
`

const Value = styled.div`
	margin-top: 10px;
	font-size: 20px;
  font-weight: 500;
  color: black;
`

const num = '0.000000'

const Balances = [
	{
		title: 'DMG Balance',
		val: '0.00000000',
		button: false
	},
	{
		title: 'DMG Earned',
		val: '0.00000000',
		button: true
	}
]

export default function Vote({ initialCurrency, params }) {
  const [proposals, setProposals] = useState([]);

	fetch('https://jsonplaceholder.typicode.com/todos')
  .then(response => response.json())
  .then(json => setProposals(json))

  return (
  	<Main>
  		<Votes>
 				<VoteTitle> 
  				Votes
  			</VoteTitle>
  		<Amount>
  			{num}
  		</Amount>
  		</Votes>
  		<Voting>
	  		<VotingWallet>
	  			<Title>
	  				Voting Wallet
	  			</Title>
	  			{Balances.map(({title, val, button}) => (
		        <Balance>
		        	<DMGTitle>
		        		{title}
		        	</DMGTitle>
		        	<Value>
		        		{val}
		        	</Value>
		        </Balance>
		      ))}
	  		</VotingWallet>
	  		<GovernanceProposals>
	 				<Title>
	  				Governance Proposals
	  			</Title>
	  			<Proposals>
		 				{proposals.map(({id, title, completed}) => (
		          <Proposal id={id} proposal={title} status={completed} />
		      	))}
		      </Proposals>
	 			</GovernanceProposals>
	 		</Voting>
		</Main>
  )
}
