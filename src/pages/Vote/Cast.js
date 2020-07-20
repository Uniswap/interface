import React, { useState } from 'react'
import styled, {keyframes} from 'styled-components'

const BackDrop = styled.div`
  width: 100vw;
	height: 100vh;
	background-color: rgba(0,0,0,0.5);
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

const Bar = styled.div`
	height: 15px;
	width: 100%;
	border-radius: 3px;
	margin-top: 20px;
	background-color: #f0f3f5;
`

const Color = styled.div`
	height: 100%;
	width: 50%;
	border-radius: 3px;
	background-color: #4487CE;
	transition: 2s;

	${({ width }) => `
    width: ${width}
  `}
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

async function castVote() {
  let response = await fetch('https://jsonplaceholder.typicode.com/todos/1')
  let data = await response.json()
  return data
} 

export default function Cast({ proposal, time, vote, onChange }) {
	const [newVote, setNewVote] = useState(false)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false); //loading hook

	const load = () => {
		setLoading(false)
		setError('Error')
	}

	const waiting = (choice) => {
		setError(null)

		//commented is the actual code for voting, but for now I am using a fake load then error after 3 seconds
		// let test 
		// castVote().then(data => {
  //     test = data
  //     setLoading(false)
  //   }).catch(error => setError(error))
		

		setLoading(true)
    setTimeout(load, 3000)
  	

  //   if(test) {
		// 	onChange(choice) //add logic to test if vote worked
		// }
	}

	return (
		<BackDrop>
			<Card>
				<Proposal>
					{proposal}
				</Proposal>
				<Time>
					{time}
				</Time>
				<Buttons>
					<Button color={'#44d394'} onClick={() => waiting('FOR')}>
						FOR
					</Button>
					<Button color={'#df5e66'} onClick={() => waiting('AGAINST')}>
						AGAINST
					</Button>
				</Buttons>
				<ErrorMessage>
					{error}
				</ErrorMessage>
				{loading ? <Loader/> : null}
				<Exit onClick={() => onChange(false)}>
					x
				</Exit>
			</Card>
		</BackDrop>
	)
}