import React, { useState } from 'react'
import styled, {keyframes} from 'styled-components'
import { Link, useLocation } from 'react-router-dom'

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

  @media (max-width: 800px) {
    width: 100%;
    height: calc(30% - 20px);
  }
`

const Title = styled.div`
	font-size: 15px;
	font-weight: 600;
	padding: 20px 30px;
  border-bottom: 1px solid #f0f3f5;
`

const Bar = styled.div`
	height: 4px;
	width: 100%;
	border-radius: 2px;
	margin-top: 10px;
	background-color: #f0f3f5;
`

const Color = styled.div`
	height: 100%;
	width: 50%;
	border-radius: 2px;

	${({ color }) => `
    background-color: ${color}
  `}
`
const Addresses = styled.div`
	width: 100%;
`

const AddressTitle = styled.div`
	padding: 20px 30px;
  border-bottom: 1px solid #f0f3f5;
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
  border-bottom: 1px solid #f0f3f5;
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
const ViewAll = styled.div`
	padding: 20px 30px;
	text-align: center;
  font-size: 13px;
 	font-weight: 700;
 	color: #b0bdc5;
`

const Description = styled.div`
	margin: 20px 30px;
	font-size: 13px;
	font-weight: 600;
`


const HistoryWrapper = styled.div`
	margin: 20px 30px;
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
		color: '#44d394'
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
			}
		],
		color: '#df5e66'
	}
]

const history = [
	{
		title: 'Created',
		date: 'July 2nd, 2020 - 7:00pm'
	},
	{
		title: 'Active',
		date: 'July 2nd, 2020 - 7:00pm'
	},
]

const description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla non pellentesque eros. Nunc mollis massa vel elit consectetur porta. Phasellus ac facilisis mauris. Integer sollicitudin pretium nibh vel accumsan. Sed porttitor finibus elit, vel aliquam dui maximus in. Sed lobortis quis nunc quis hendrerit. Mauris volutpat ipsum eu dolor ornare tincidunt. Vestibulum nec risus a ante sagittis faucibus. Ut luctus ex diam, vel luctus ligula condimentum rutrum. Donec diam quam, malesuada quis felis eget, placerat venenatis felis. Curabitur tellus neque, elementum ut libero eu, convallis efficitur arcu. Nullam vestibulum, erat molestie lacinia lobortis, nibh augue ornare ante, et sodales arcu nisl in justo. Integer sed quam eu lacus blandit vulputate.'

export default function Details() {
	const id = useLocation().pathname.split("/")[2];
	const date = 'Executed July 2nd, 2020'
	const proposal = 'quis ut nam facilis et officia qui'
	const status = 'Active'

	const shorten = (a) => `${a.substring(0, 6)}...${a.substring(a.length-4, a.length)}`
	const addressTitle = (l) => `${l} ${l === 1 ? 'Address' : 'Addresses'}`

	const amount = 3 //can change 

	return (
		<Main>
			<Link to={'/vote'} style={link}>
				&#8592; Overview
			</Link>
			<Wrapper>
				<Proposal>
			  	{proposal}
			  </Proposal>
			  <Info active={true}>
				  <Status active={true}>
				  	{status}
				  </Status>
				  <Extra>
				  	{id} &#8226; {date} 
				  </Extra>
				</Info>
			</Wrapper>
			<Body>
				{votes.map(({title, val, addresses, color}) => {
					const a = addresses
					const l = a.length
					let empty
					if(l < amount){
						empty = [...Array(amount-l)].fill({address: '—', vote: '—'}, 0)
					}

					return(
						<Card width={50}>
							<Title>
								{title}
								<Bar>
									<Color color={color}/>
								</Bar>
							</Title>
							<Addresses>
								<AddressTitle>
									{addressTitle(a.length)}
									<VotesTitle>Votes</VotesTitle>
								</AddressTitle>
								{[...a, ...empty].map((address) => {
									const active = address.address.length > 1

									return(
										<Address active={active}>
											{active ? shorten(address.address) : address.address}
											<Votes>{address.vote}</Votes>
										</Address>
									)
								})}
							</Addresses>
							<ViewAll>
								VIEW ALL
							</ViewAll>
						</Card>
					)})}
			</Body>
			<Card width={60}>
				<Title>
					Details
				</Title>
				<Description>	
					{description}
				</Description>
			</Card>
			<Card width={40}>
				<Title>
					Proposal History
				</Title>
				<HistoryWrapper>
					{history.map(({title, date}) => 
						<History>
							<Check active={title === 'Active'}>
								&#10003;
							</Check>
							<HistoryInfo>
								<HistoryTitle>
									{title}
								</HistoryTitle>
								<HistoryDate>
									{date}
								</HistoryDate>
							</HistoryInfo>
						</History>
					)}
				</HistoryWrapper>
			</Card>
		</Main>
	)
}