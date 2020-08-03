import React, { useState } from 'react'
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
	width: 30vw;
	transform: translate(-50%, -50%);
	border-radius: 5px;
	opacity: 1;
	z-index: 5;
	padding: 80px;
	text-align: center;
	font-weight: 600;
	color: black;
`

const Proposal = styled.div`
	font-size: 20px;
`

const Time = styled.div`
	font-size: 12px;
	color: #4487CE;
`

const Exit = styled.div`
	position: absolute;
	right: 7px;
	top: 5px;
	cursor: pointer;
	font-size: 20px;
`

const Buttons = styled.div`
	margin-top: 20px;
`

const Button = styled.div`
	display: inline-block;
	color: #FFFFFF;
  text-align: center;
  border-radius: 3px;
  font-size: 15px;
  font-weight: 700;
  height: 19px;
  width: 85px;
  padding: 3px;
  display: inline-block;
  margin: 10px;
  cursor: pointer;

  ${({ color }) => `
    background-color: ${color}
  `}
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

export default function CastVote({ proposal, timestamp, onChange }) {
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
				<Proposal>
					{proposal.title}
				</Proposal>
				<Time>
					{timestamp}
				</Time>
				<Buttons>
					<Button color={'#44d394'} onClick={() => castVote(true)}>
						FOR
					</Button>
					<Button color={'#df5e66'} onClick={() => castVote(false)}>
						AGAINST
					</Button>
				</Buttons>
				<ErrorMessage>
					{error}
				</ErrorMessage>
				{loading ? <Loader/> : null}
				<Exit onClick={() => onChange(false)}>
					X
				</Exit>
			</Card>
		</BackDrop>
	)
}