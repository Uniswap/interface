import React, { useState } from 'react';
import styled from 'styled-components'

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
      color: #9a6eee;
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
      border: 2px solid #9a6eee;
      color: #9a6eee;
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
`

const Extra = styled.div`
  font-weight: 700;
	padding-left: 7px;
	display: inline-block;
`

export default function Proposal({ id, proposal, status }) {
	const text = status ? 'Active' : 'Passed'
	let votes = ['NO VOTE', 'FOR', 'AGAINST', 'DID NOT VOTE']
	votes = status ? votes.slice(0, 3) : votes.slice(1, 4)
	const vote = votes[id%3];

  return (
		<Main>
			<Wrapper>
			  {proposal}
			  <Info active={status}>
				  <Status active={status}>
				  	{text}
				  </Status>
				  <Extra>
				  	{id} &#8226; {`Executed July 2nd, 2020`} 
				  </Extra>
				</Info>
			</Wrapper>
			<Vote>
				{vote}
			</Vote>
		</Main> 
  )
}
