import { TimePeriod } from 'hooks/useTopTokens'
import useTopTokens from 'hooks/useTopTokens'
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
const SparkLineImg = styled.div`
  width: 124px;
  height: 28px;
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

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()
  const timePeriod = TimePeriod.day
  if (error || data === null) {
    return <GridContainer>Error Loading Top Token Data</GridContainer>
  }
  if (loading) {
    return <GridContainer>Top Token Data Loading</GridContainer>
  }
  if (data === null) {
    return <GridContainer>No Top Token Data Available</GridContainer>
  }
  const topTokenAddresses = Object.keys(data)

  const tokenRows = topTokenAddresses.map((tokenAddress) => {
    const tokenData = data[tokenAddress]

    // TODO: retrieve actual token name: useToken(tokenAddress)
    const tokenName = 'Bitcoin'
    const tokenSymbol = 'XXX'
    const favorited = false
    const listNumber = 1

    return (
      <TokenRow key={tokenAddress}>
        <FavoriteContainer>{favorited ? <Heart size={15} /> : <Heart size={15} />}</FavoriteContainer>
        <ListNumberContainer>{listNumber}</ListNumberContainer>
        <NameContainer>
          <Circle opacity={0.6} />
          {tokenName}|{tokenSymbol}
        </NameContainer>
        <PriceContainer>${tokenData.price}</PriceContainer>
        <PercentChangeContainer>
          <>
            {tokenData.delta}%
            {/*Math.sign(tokenData.price) > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />*/}
          </>
        </PercentChangeContainer>
        <MarketCapContainer>{tokenData.marketCap}</MarketCapContainer>
        <VolumeContainer>{tokenData.volume[timePeriod]}</VolumeContainer>
        <SparkLineContainer>
          <SparkLineImg dangerouslySetInnerHTML={{ __html: tokenData.sparkline }} />
        </SparkLineContainer>
        <SwapContainer>
          <SwapButton>Swap</SwapButton>
        </SwapContainer>
      </TokenRow>
    )
  })

  // handles header
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
      {tokenRows}
    </GridContainer>
  )
}
