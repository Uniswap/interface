import React, { useState } from 'react'
import Close from '../../assets/svg/close-black-18dp.svg'
import styled, { keyframes } from 'styled-components'
import { useGovernorContract } from '../../hooks'
import { ethers } from 'ethers'
import { calculateGasMargin } from '../../utils'
import * as Sentry from '@sentry/browser'
import { useTransactionAdder } from '../../contexts/Transactions'

const BackDrop = styled.div`
  width: 100vw;
	height: 100vh;
	background-color: rgba(0,0,0,0.5);
	position: fixed;
	top: 0;
	left: 0;
	z-index: 110;
`

const Card = styled.div`
	background-color: #FFFFFF;
	position: relative;
	left: 50%;
	top: 50%;
	width: 340px;
	transform: translate(-50%, -50%);
	border-radius: 5px;
	opacity: 1;
	z-index: 5;
	padding: 25px 40px 5px;
	text-align: center;
	font-weight: 600;
	color: black;
`

const Title = styled.div`
  font-size: 32px;
  font-weight: 300;
  text-align: left;
  margin-bottom: 6px;
  color: #0a2a5a;
`

const Proposal = styled.div`
	font-size: 20px;
	text-align: left;
`

const Time = styled.div`
	font-size: 12px;
	color: #4487CE;
	text-align: left;
	opacity: 0.6;
`

const Exit = styled.div`
	position: absolute;
	right: 12px;
	top: 11px;
	cursor: pointer;
	font-size: 20px;
`

const Buttons = styled.div`
	margin-top: 20px;
	margin-bottom: 10px;
`

const Button = styled.div`
	display: inline-block;
	color: #FFFFFF;
  text-align: center;
  border-radius: 5px;
  font-size: 15px;
  font-weight: 600;
  padding: 3px;
  display: inline-block;
  margin: 10px;
  cursor: pointer;
  height: 28px;
  width: 56px;
  padding: 6px 12px;
  line-height: 28px;
  transition: opacity 0.2s ease-in-out;

  ${({ color }) => `
    background-color: ${color}
  `}
  
  :hover {
    opacity: 0.7;
  }
`

const ErrorMessage = styled.div`
	margin-top: 20px;
	color: #cc0000;
	font-size: 13px;
	font-weight: 500;
`

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const Loader = styled.div`
  border: 5px solid #f3f3f3; /* Light grey */
  border-top: 5px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: ${spin} 2s linear infinite;
  margin: 0 auto;
`

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 15px;
  margin-left: 2px;
`

async function castVote() {
  let response = await fetch('https://jsonplaceholder.typicode.com/todos/1')
  let data = await response.json()
  return data
}

//export default function Cast({ proposal, time, vote, onChange }) {
export default function CastVoteDialogue({ proposal, timestamp, onChange }) {
  const [newVote, setNewVote] = useState(false)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false); //loading hook

	const governorContract = useGovernorContract()
	const addTransaction = useTransactionAdder()
	const proposalId = proposal.proposalId

	const castVote = async (isForProposal) => {
		const GAS_MARGIN = ethers.BigNumber.from(1000)
		setLoading(true)
		setError(null)

		const estimatedGas = await governorContract.estimateGas
			.castVote(proposalId, isForProposal)
			.catch(error => {
				console.error(`Error getting gas estimation for casting vote with ID ${proposalId}: `, error)
				return ethers.BigNumber.from('500000');
			})

		governorContract
			.castVote(proposalId, isForProposal, {
				gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
			})
			.then(response => {
				setLoading(false)
				addTransaction(response, { proposalId: proposalId })
			})
			.catch(error => {
				setLoading(false)
				if(error?.code !== 4001) {
					console.error(`Could not cast vote due to error: `, error)
					Sentry.captureException(error)
				} else {
					console.log('Could not cast vote because the transaction was cancelled')
				}
			})
	}

	return (
		<BackDrop>
			<Card>
        <Title>
          Cast your vote
        </Title>
        <Underline/>
				<Proposal>
					{proposal.title}
				</Proposal>
				<Time>
					{timestamp}
				</Time>
				<Buttons>
					<Button color={'#09b53d'} onClick={() => castVote(true)}>
						For
					</Button>
					<Button color={'#d4001e'} onClick={() => castVote(false)}>
						Against
					</Button>
				</Buttons>
				<ErrorMessage>
					{error}
				</ErrorMessage>
				{loading ? <Loader/> : null}
				<Exit onClick={() => onChange(false)}>
					<img src={Close}/>
				</Exit>
			</Card>
		</BackDrop>
	)
}