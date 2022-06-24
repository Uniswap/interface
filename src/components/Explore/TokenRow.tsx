import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import { TimePeriod, TokenData } from 'hooks/useTopTokens'
import React from 'react'
import { ArrowDownRight, ArrowUpRight, Heart } from 'react-feather'
import styled from 'styled-components/macro'

const TokenRowWrapper = styled.div`
  width: 100%;
  height: 60px;
  display: grid;
  padding: 0px 12px;
  grid-template-columns: 40px 32px 200px 107.5px 107.5px 107.5px 107.5px 172px 62px;
  font-size: 15px;
  line-height: 24px;
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

  background: ${({ theme }) => theme.primary2};
  border-radius: 12px;
  border: none;
  color: ${({ theme }) => theme.white};
`

const TokenSymbol = styled.span`
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

export default function TokenRow({
  key,
  tokenAddress,
  data,
  listNumber,
  timePeriod,
}: {
  key: string
  tokenAddress: string
  data: TokenData
  listNumber: number
  timePeriod: TimePeriod
}) {
  const token = useToken(tokenAddress)
  const tokenName = token?.name
  const tokenSymbol = token?.symbol
  const tokenData = data[tokenAddress]
  // TODO: write favorited hook
  // TODO: remove magic number colors
  const favorited = false
  return (
    <TokenRowWrapper key={key}>
      <FavoriteContainer>{favorited ? <Heart size={15} /> : <Heart size={15} />}</FavoriteContainer>
      <ListNumberContainer>{listNumber}</ListNumberContainer>
      <NameContainer>
        <CurrencyLogo currency={useCurrency(tokenAddress)} />
        {tokenName} <TokenSymbol>{tokenSymbol}</TokenSymbol>
      </NameContainer>
      <PriceContainer>${tokenData.price}</PriceContainer>
      <PercentChangeContainer>
        <PercentChangeContent>
          {tokenData.delta}%
          <ArrowContainer>
            {Math.sign(tokenData.delta) > 0 ? (
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
    </TokenRowWrapper>
  )
}
