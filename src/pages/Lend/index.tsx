import React, { useMemo } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'

import Summary from '../../components/Summary'
import SupplyMarkets from '../../components/SupplyMarkets'
import BorrowMarkets from '../../components/BorrowMarkets'
import { CToken, CTokenState, useCTokens } from '../../data/CToken'
import { getBorrowTotalBalance, getLimit, getNetApy, getSupplyTotalBalance } from '../../utils'
import { Fraction, JSBI } from '@uniswap/sdk'

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
          .reduce<{ [cAddress: string]: CToken }>((memo, [, curr]) => {
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
  // console.log(getSupplyTotalBalance1(allMarketCTokens).toSignificant(6), 'getSupplyTotalBalance1')

  const supplyTotalBalance = getSupplyTotalBalance(allMarketCTokens)
  const borrowTotalBalance = getBorrowTotalBalance(allMarketCTokens)
  const limit = getLimit(allMarketCTokens)

  const usedLimt: Fraction = getSupplyTotalBalance(allMarketCTokens)
    .divide(getLimit(allMarketCTokens))
    .multiply(JSBI.BigInt(100))

  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <Summary
          supplyTotalBalance={supplyTotalBalance}
          borrowTotalBalance={borrowTotalBalance}
          limit={limit}
          usedLimit={usedLimt}
          netApy={getNetApy(allMarketCTokens)}
        ></Summary>
        <MarketsWrap>
          <SupplyMarkets
            allMarketCTokens={allMarketCTokens}
            borrowTotalBalance={borrowTotalBalance}
            limit={limit}
            usedLimit={usedLimt}
          ></SupplyMarkets>
          <BorrowMarkets
            allMarketCTokens={allMarketCTokens}
            borrowTotalBalance={borrowTotalBalance}
            limit={limit}
            usedLimit={usedLimt}
          ></BorrowMarkets>
        </MarketsWrap>
      </PageWrapper>
    </>
  )
}
