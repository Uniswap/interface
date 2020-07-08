import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Cast from './Cast'

const Main = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: black;
  padding: 20px 30px;
  border-bottom: 1px solid #DCDCDC;
  height: 100%;
  width: calc(100% - 60px);
`

const Wrapper = styled.div`
  height: 100%;
  width: 80%;
  display: inline-block;
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
  border-radius: 3px;
  height: 15px;
  width: 50px;
  padding: 3px;
  display: inline-block;

  ${({ active }) => active && `
    border: 2px solid #4487CE;
		color: #4487CE;
  `}
`

const Vote = styled.div`
  height: 100%;
  width: 20%;
  display: inline-block;
  font-size: 15px;
  font-weight: 600;
  color: #b7c3cc;
  text-align: center;

  ${({ cast }) => cast && `
    color: black;
    cursor: pointer;
  `}
`

const Extra = styled.div`
  font-weight: 700;
	padding-left: 7px;
	display: inline-block;
`



export default function Proposal({ id, proposal, status }) {
	const availableVotes = ['VOTE', 'FOR', 'AGAINST', 'NO VOTE']
	const mod = (b,e) => availableVotes.slice(b, e)

	let votes 
	let text
	if(status) {
		text = 'Active'
		votes = mod(0,3)
	}
	else {
		text = 'Passed'
		votes = mod(1,4)
	}

	const v = votes[id%2]; //determines vote based on id - TEMPORARY
	const [vote, setVote] = useState(v)

	const c = v === 'VOTE'
	const [cast, setCast] = useState(c)
	const [showCast, changeShowCast] = useState(false)

	const handleClick = (e) => {
		console.log(mod(1,3))
		console.log(mod(1,3).includes(e))
		if(mod(1,3).includes(e)) {
			setVote(e)
			setCast(false)
		}
	  changeShowCast(false)
	}

	const keypress = (e) => {
	  if(e.keyCode === 27) changeShowCast(false)
	}

	useEffect(() => {
    document.addEventListener("keydown", (e)=>keypress(e), false);
  })

  const date = 'Executed July 2nd, 2020'

  return (
		<Main>
			<Wrapper>
			  {proposal}
			  <Info active={status}>
				  <Status active={status}>
				  	{text}
				  </Status>
				  <Extra>
				  	{id} &#8226; {date} 
				  </Extra>
				</Info>
			</Wrapper>
			<Vote onClick={() => changeShowCast(cast)} cast={cast}>
				{vote}
			</Vote>
			{showCast ? 
				<Cast
					proposal={proposal}
					time={date}
					onChange={e => handleClick(e)} 
					vote={(v) => setVote(v)}/> 
				: null
			}
		</Main> 
  )
}
