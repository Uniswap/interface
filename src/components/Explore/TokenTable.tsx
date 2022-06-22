import React from 'react'
import { Circle, Heart } from 'react-feather'
import styled from 'styled-components/macro'

const GridContainer = styled.div`
  display: grid;
  width: 960px;
  background: ${({ theme }) => theme.bg0};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px;
`

const TokenRow = styled.div`
  width: 100%;
  height: 60px;
  display: grid;
  padding: 0px 12px;
  grid-template-columns: 40px 32px 200px 107.5px 107.5px 107.5px 107.5px 172px 62px;
`

const HeaderRow = styled(TokenRow)`
  padding: 0 12 0 12;
  height: 48px;
  color: ${({ theme }) => theme.text2};
  font-size: 12px;
  line-height: 16px;
`

const FavoriteContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 14px 0px;
  gap: 10px;

  width: 40px;
  height: 60px;
`
const ListNumberContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 14px 0px;
  gap: 10px;

  width: 32px;
  height: 60px;
`
const NameContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 14px 8px;
  gap: 8px;

  width: 200px;
  height: 60px;
`
const PriceContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 8px;
  gap: 10px;

  width: 107.5px;
  height: 60px;
`
const PercentChangeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding: 14px 8px;
  gap: 10px;

  width: 107.5px;
  height: 60px;
`
const MarketCapContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 8px;
  gap: 10px;

  width: 107.5px;
`
const VolumeContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 8px;
  gap: 10px;

  width: 107.5px;
`
const SparkLineContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px 24px;
  gap: 10px;

  width: 172px;
`
const SwapContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px 4px;
  gap: 10px;

  width: 62px;
`

const SwapButton = styled.button`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px;
  gap: 6px;

  width: 54px;
  height: 32px;

  background: #4c82fb;
  border-radius: 12px;
  border: none;
  color: ${({ theme }) => theme.text1};
`

function loadTokenData({
  favorited,
  listNumber,
  name,
  price,
  percentChange,
  marketCap,
  volume,
  sparkLine,
}: {
  favorited: boolean
  listNumber: number
  name: string
  price: number
  percentChange: number // percentage
  marketCap: number
  volume: number
  sparkLine: string // svg string
}) {
  return (
    <TokenRow key={name}>
      <FavoriteContainer>{favorited ? <Heart size={15} /> : <Heart size={15} />}</FavoriteContainer>
      <ListNumberContainer>{listNumber}</ListNumberContainer>
      <NameContainer>
        <Circle opacity={0.6} />
        {name}
      </NameContainer>
      <PriceContainer>${price}</PriceContainer>
      <PercentChangeContainer>
        <>
          {percentChange}%{/*Math.sign(percentChange) > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />*/}
        </>
      </PercentChangeContainer>
      <MarketCapContainer>{marketCap}</MarketCapContainer>
      <VolumeContainer>{volume}</VolumeContainer>
      <SparkLineContainer>{sparkLine}</SparkLineContainer>
      <SwapContainer>
        <SwapButton>Swap</SwapButton>
      </SwapContainer>
    </TokenRow>
  )
}
export default function TokenTable() {
  const dummyData = [
    {
      favorited: false,
      listNumber: 1,
      name: 'Bitcoin BIT',
      price: 130,
      percentChange: 1.5,
      marketCap: 10,
      volume: 10,
      sparkLine: 'sparkyGraph',
    },
    {
      favorited: false,
      listNumber: 2,
      name: 'ethereum ETH',
      price: 120,
      percentChange: 1.5,
      marketCap: 10,
      volume: 14,
      sparkLine: 'sparkyGraph',
    },
    {
      favorited: false,
      listNumber: 3,
      name: 'Tether USDT',
      price: 130,
      percentChange: 1.5,
      marketCap: 19,
      volume: 10,
      sparkLine: 'sparkyGraph',
    },
  ]

  const header = (
    <HeaderRow>
      <div></div>
      <div></div>
      <NameContainer>Name</NameContainer>
      <PriceContainer>Price</PriceContainer>
      <PercentChangeContainer>% Change</PercentChangeContainer>
      <MarketCapContainer>Market Cap</MarketCapContainer>
      <VolumeContainer>1D Volume</VolumeContainer>
    </HeaderRow>
  )

  return (
    <GridContainer>
      {header}
      {loadTokenData(dummyData[0])}
      {loadTokenData(dummyData[1])}
      {loadTokenData(dummyData[2])}
    </GridContainer>
  )
}
