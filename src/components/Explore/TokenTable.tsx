import { useToken } from 'hooks/Tokens'
import { TimePeriod } from 'hooks/useTopTokens'
import useTopTokens from 'hooks/useTopTokens'
import React from 'react'
import { ArrowDownRight, ArrowUpRight, Circle, Heart } from 'react-feather'
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
  justify-content: center;
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
  color: ${({ theme }) => theme.text2};

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
  color: ${({ theme }) => theme.text2};

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

const PercentChangeContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
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
  max-width: 124px;
  max-height: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transform: scale(1.2);
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

const TokenSymbol = styled.span`
  font-weight: 400;
  font-size: 16px;
  color: ${({ theme }) => theme.text3};
`
const ArrowContainer = styled.div`
  padding: 0px 0px 0px 4px;
`

/* formats price with appropriate string */
function priceFormatter(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()
  const timePeriod = TimePeriod.day
  const GetToken = (tokenAddress: string) => {
    return useToken(tokenAddress)
  }
  if (error) {
    return <GridContainer>Error Loading Top Token Data</GridContainer>
  }
  if (loading) {
    return <GridContainer>Top Token Data Loading</GridContainer>
  }
  if (data === null) {
    return <GridContainer>No Top Token Data Available</GridContainer>
  }
  const topTokenAddresses = Object.keys(data)
  let listNumber = 0

  const tokenRows = topTokenAddresses.map((tokenAddress) => {
    const tokenData = data[tokenAddress]
    /*
    TODO: retrieve actual token name: useToken(tokenAddress)
    const token = GetToken(tokenAddress)
    */
    const tokenName = 'Bitcoin'
    const tokenSymbol = 'BTC'
    const favorited = false // TODO: write favorites hook
    listNumber += 1
    // TODO: remove magic number colors
    return (
      <TokenRow key={tokenAddress}>
        <FavoriteContainer>{favorited ? <Heart size={15} /> : <Heart size={15} />}</FavoriteContainer>
        <ListNumberContainer>{listNumber}</ListNumberContainer>
        <NameContainer>
          <Circle opacity={0.6} />
          {tokenName} <TokenSymbol>{tokenSymbol}</TokenSymbol>
        </NameContainer>
        <PriceContainer>${tokenData.price}</PriceContainer>
        <PercentChangeContainer>
          <PercentChangeContent>
            {tokenData.delta}%
            <ArrowContainer>
              {Math.sign(tokenData.price) > 0 ? (
                <ArrowUpRight size={14} color={'#57bd0f'} />
              ) : (
                <ArrowDownRight size={14} color={'red'} />
              )}
            </ArrowContainer>
          </PercentChangeContent>
        </PercentChangeContainer>
        <MarketCapContainer>{priceFormatter(tokenData.marketCap)}</MarketCapContainer>
        <VolumeContainer>{priceFormatter(tokenData.volume[timePeriod])}</VolumeContainer>
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
