import React, { useState, useEffect } from 'react'
import Proposal from './Proposal'
import styled, {keyframes} from 'styled-components'

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

  @media (max-width: 800px) {
    width: 100%;
    height: calc(30% - 20px);
  }
`
const GovernanceProposals = styled.div`
  background-color: #FFFFFF;
  width: calc(65% - 20px);;
  margin: 10px;
  border-radius: 5px;
  margin-bottom: 1rem;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  color: black;
  display: inline-block;
  vertical-align: top;

  @media (max-width: 800px) {
    width: 100%;
    height: calc(70% - 20px);
  }
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
`

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const Loader = styled.div`
  border: 8px solid #f3f3f3; /* Light grey */
  border-top: 8px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: ${spin} 2s linear infinite;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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
  color: #b7c3cc;
  display: inline;

  ${({ active }) => active && `
    color: black;
  `}

`

const Withdraw = styled.div`
	font-size: 18px;
  font-weight: 700;
  color: black;
  display: inline;
  cursor: not-allowed;
  color: #b7c3cc;
  float: right;

  ${({ active }) => active && `
      color: #2fdaa5;
      cursor: pointer
  `}
`

const Pages = styled.div`
  text-align: center;
  font-weight: 600;
  margin: 10px;
`

const Page = styled.div`
  margin: 3px;
  display: inline;
  color: #b7c3cc;
  cursor: pointer;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  ${({ active }) => active && `
      color: black;
  `}
  ${({ off }) => off && `
      color: white;
  `}
`

const num = '0.000000'

const displayPages = 7;

const Balances = [
	{
		title: 'DMG Balance',
		val: '0.00000000',
		button: false
	},
	{
		title: 'DMG Earned',
		val: 'none',
		button: true
	}
]

function WithdrawAmount(val) {
	val > 0 ? console.log('Withdrawn!') : console.log('No funds!')
}

function display(p, selected, l) {
  if(l <= displayPages) return true //displays all pages if it is less than the diplayed amount

  const half = (displayPages-1)/2 

  if(p <= displayPages && selected <= half) return true //displays displayed amount pages even if is does not have half on the left
  if(p > l - displayPages && selected > l - half) return true //displays displayed amount pages even if is does not have half on the right

  const fill = [...Array(half).keys()].map(i => i+1) //gets a half array
  const left = fill.map(i => selected-i) //uses the half array to find values to left of selected
  const right = fill.map(i => selected+i) //uses the half array to find values to right of selected
  return [...left, selected, ...right].includes(p) //combines the selected value and two arrays to check if the value falls in here
}

export default function Vote() {
  const [proposals, setProposals] = useState([]); //proposal hook
  const [loading, setLoading] = useState(true); //loading hook
  const [page, changePage] = useState(1); //current page hook

  const perPage = 5//make dynamic
  const mp = page * perPage - perPage 
  const proposalPage = proposals.slice(mp, mp+perPage)
  const pages = [...Array(Math.ceil(proposals.length/perPage)).keys()].map(i => i + 1) //creates pages off of proposals
  const l = pages.length

  const checkChange = (i) => {
    if(i > 0 && i < l + 1) changePage(i) //does not change the page value if the button is disabled
  }

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/todos')
    .then(response => response.json())
    .then(json => setProposals(json))
    .then(() => setLoading(false))
  })

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
		        	{button ? 
		        		<Withdraw active={parseFloat(val, 10) > 0} onClick={() => WithdrawAmount(val)}>
			        		Withdraw
			        	</Withdraw>
			       	:null}
		        </Balance>
		      ))}
	  		</VotingWallet>
	  		<GovernanceProposals>
	 				<Title>
	  				Governance Proposals
	  			</Title>
	  			<Proposals>
		 				{loading ? <Loader /> :
		 				proposalPage.map(({id, title, completed}) => (
		          <Proposal id={id} proposal={title} status={completed} /> 
		      	))}
		      </Proposals>
          <Pages>
            <Page onClick={() => checkChange(page - 1)} off={page === 1}> 
              {`<`}
            </Page>
            {pages.filter(i => display(i, page, l)).map((p, index) => (
              <Page onClick={() => changePage(p)} active={page === p}>
                {p}
              </Page>
            ))}
            <Page onClick={() => checkChange(page + 1)} off={page === l}> 
              {`>`}
            </Page>
          </Pages>
	 			</GovernanceProposals>
	 		</Voting>
		</Main>
  )
}
