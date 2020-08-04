import React, { useState, useEffect } from 'react'
import styled, {keyframes} from 'styled-components'
import Cast from './Cast'
import { Link, useLocation, Redirect } from 'react-router-dom'

const Main = styled.div`
  width: 70vw;
  position: absolute;
  height: calc(100vh - 160px);
  top: 100px;
  left: 0;
	right: 0;
	margin-left: auto;
	margin-right: auto;
	overflow-y: scroll;

  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  ::-webkit-scrollbar { /* Hide scrollbar for Chrome, Safari and Opera */
    display: none;
  }

  @media (max-width: 1000px) {
    top: 140px;
    width: 80vw;
    height: calc(100vh - 200px);
  }

  @media (max-width: 800px) {
    width: 90vw;
  }
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
	display: inline-block;
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
  border-radius: 5px;
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
    width: calc(100% - 20px);
  }
`

const Title = styled.div`  
  font-size: 28px;
  font-weight: 300;
  color: #0a2a5a;
  padding: 20px 0 10px;
  margin: 0 30px;
  
  @media (max-width: 800px) {
    font-size: 23px;
  }
`

const Bar = styled.div`
	height: 4px;
	width: 100%;
	border-radius: 2px;
	margin-top: 10px;
	background-color: #e2e2e2;
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
  border-bottom: 1px solid #e2e2e2;
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
  border-bottom: 1px solid #e2e2e2;
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
const View = styled.div`
	padding: 20px 30px;
	text-align: center;
  font-size: 13px;
 	font-weight: 700;
 	color: #b0bdc5;
 	cursor: pointer;
 	transition: opacity 0.2s ease-in-out;

 	${({ active }) => active && `
    color: black;
  `}
  
  :hover {
    opacity: 0.7;
  }
`

const Description = styled.div`
	margin: 20px 30px 25px;
	font-size: 13px;
	font-weight: 600;
`


const HistoryWrapper = styled.div`
	margin: 20px 30px 25px;
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

const Vote = styled.div`
  display: inline-block;
  font-size: 15px;
  font-weight: 700;
  color: #b7c3cc;
	float: right; 
	margin-right: 10px;
	margin-top: 50px;
  text-align: center;
  border: 2px solid #b7c3cc;
  border-radius: 35px;
  height: 18px;
  width: 65px;
  padding: 3px;
  cursor: pointer;

  ${({ cast }) => cast && `
    color: black;
    cursor: pointer;
    border: 2px solid black;
  `}
`

const CastWrapper = styled.div`
  position: absolute;
	top: -100px;
	left: -15vw;
	z-index: 5;
`

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 8px;
  margin-left: 30px;
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
		color: '#09b53d'
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
			},
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			},
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			},
			{
				address: '0x62b5fc62f3f2277c3c51e672e2faef82a279c7ac1dd9d9416c9ec536ae3d5e63',
				vote: 0.037
			},
		],
		color: '#d4001e'
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

function valid(id) {
	if(id < 0 || id > 200) return false
	return true
}

async function getDetails() {
  let response = await fetch('https://jsonplaceholder.typicode.com/todos/1')
  let data = await response.json()
  return data
} 

export default function Details() {
	const [vote, setVote] = useState('Vote')
	const [cast, setCast] = useState(true)
	const [showCast, changeShowCast] = useState(false)

	const per = 3 //can change. Amount originally shown for amount of addresses
	const [amount, changeAmount] = useState(per) 

	const handleClick = (e) => {
		if(e) {
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

	const id = useLocation().pathname.split("/")[2];
	if(!valid(id)) return <Redirect to={{pathname: '/vote', state: {badpath: true}}}/>

	//temporary details
	let date = 'Executed July 2nd, 2020'
	let proposal = 'quis ut nam facilis et officia qui'
	let status = 'Active'

//actual logic below
	// useEffect(() => {
 //    getDetails().then(data => {
 //      date = data.date
 //      proposal = data.proposal
 //      status = data.status
 //    }).catch(error => {
 //    	if(error === 'badID') {
 //    		return <Redirect to={{pathname: '/vote', state: {badpath: true}}}/>
 //    	}
 //    })
 //  })

	const shorten = (a) => `${a.substring(0, 6)}...${a.substring(a.length-4, a.length)}`
	const addressTitle = (l) => `${l} ${l === 1 ? 'Address' : 'Addresses'}`
	const checkChange = (l) => {
		if(l > amount) changeAmount(l)
		if(l === amount) changeAmount(per)
	}

	return (
		<Main>
			<Link to={'/vote'} style={link}>
				&#8592; Overview
			</Link>
			<div>
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
				<Vote onClick={() => changeShowCast(cast)} cast={cast}>
					{vote}
				</Vote>
			</div>
			<Body>
				{votes.map(({title, val, addresses, color}) => {
					let a = addresses
					const l = a.length
					let empty
					let display

					if(l < amount){
						empty = [...Array(amount-l)].fill({address: '—', vote: '—'}, 0)
						display = [...a, ...empty]
					}
					if(l >= amount){
						a = addresses.slice(0, amount)
						display = a
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
									{addressTitle(addresses.length)}
									<VotesTitle>Votes</VotesTitle>
								</AddressTitle>
								{display.map((address) => {
									const active = address.address.length > 1

									return(
										<Address active={active}>
											{active ? shorten(address.address) : address.address}
											<Votes>{address.vote}</Votes>
										</Address>
									)
								})}
							</Addresses>
							<View onClick={() => checkChange(l)} active={l > amount || l === amount}>
								{amount === per ? 'View All' : 'View Fewer'}
							</View>
						</Card>
					)})}
			</Body>
			<Card width={60}>
				<Title>
					Details
				</Title>
        <Underline/>
				<Description>	
					{description}
				</Description>
			</Card>
			<Card width={40}>
				<Title>
					Proposal History
				</Title>
        <Underline/>
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