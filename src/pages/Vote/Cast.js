import React, { useState } from 'react'
import styled from 'styled-components'

const BackDrop = styled.div`
  width: 100vw;
	height: 100vh;
	background-color: rgba(0,0,0,0.5);
	position: absolute;
	top: -140px;
	left: -10vw;
	z-index: 5;
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

export default function Cast({ proposal, time, vote, onChange }) {
	const [newVote, setNewVote] = useState(false)

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
					<Button color={'#44d394'} onClick={() => onChange('FOR')}>
						FOR
					</Button>
					<Button color={'#df5e66'} onClick={() => onChange('AGAINST')}>
						AGAINST
					</Button>
				</Buttons>
				<Exit onClick={() => onChange(false)}>
					x
				</Exit>
			</Card>
		</BackDrop>
	)
}