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
  width: 50vw;
	height: 80vh;
	background-color: #FFFFFF;
	position: relative;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	border-radius: 5px;
	opacity: 1;
	z-index: 5;
`

const Exit = styled.div`
	position: absolute;
	right: 5px;
	top: 5px;
	cursor: pointer;
	font-size: 20px;
`

export default function Cast({ vote, onClick }) {
	return (
		<BackDrop>
			<Card>
				Hey
				<Exit onClick={onClick}>
					x
				</Exit>
			</Card>
		</BackDrop>
	)
}