import React, { useMemo } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'

import Summary from '../../components/Summary'
import SupplyMarkets from '../../components/SupplyMarkets'
import BorrowMarkets from '../../components/BorrowMarkets'
import { CToken, CTokenState, useCTokens } from '../../data/CToken'
import { getBorrowTotalBalance, getLimit, getNetApy, getSupplyTotalBalance } from '../../utils'

const PageWrapper = styled(AutoColumn)`
  max-width: 1280px;
  width: 80%;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 86%;
  `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`

const MarketsWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-content: space-between;
  align-items: start;
  flex-direction: row;
  gap: 1.3rem;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    grid-template-columns: 1fr;
  `};
`

function useAllMarketCTokens(markets: [CTokenState, CToken | null][]): CToken[] {
  return useMemo(
    () =>
      Object.values(
        markets
          // filter out invalid ctokens
          .filter((result): result is [CTokenState.EXISTS, CToken] =>
            Boolean(result[0] === CTokenState.EXISTS && result[1])
          )
          // filter out duplicated ctokens
          .reduce<{ [pairAddress: string]: CToken }>((memo, [, curr]) => {
            memo[curr.cAddress] = memo[curr.cAddress] ?? curr
            return memo
          }, {})
      ),
    [markets]
  )
}

export default function Lend() {
  const allMarkets = useCTokens()

  const allMarketCTokens: CToken[] = useAllMarketCTokens(allMarkets)

  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <Summary
          supplyTotalBalance={getSupplyTotalBalance(allMarketCTokens)}
          borrowTotalBalance={getBorrowTotalBalance(allMarketCTokens)}
          limit={getLimit(allMarketCTokens)}
          netApy={getNetApy(allMarketCTokens)}
        ></Summary>
        <MarketsWrap>
          <SupplyMarkets
            allMarketCTokens={allMarketCTokens}
            borrowTotalBalance={getBorrowTotalBalance(allMarketCTokens)}
            limit={getLimit(allMarketCTokens)}
          ></SupplyMarkets>
          <BorrowMarkets
            allMarketCTokens={allMarketCTokens}
            borrowTotalBalance={getBorrowTotalBalance(allMarketCTokens)}
            limit={getLimit(allMarketCTokens)}
          ></BorrowMarkets>
        </MarketsWrap>
      </PageWrapper>
    </>
  )
}
