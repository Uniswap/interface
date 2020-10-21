import React from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'

import Summary from '../../components/Summary'
import SupplyMarkets from '../../components/SupplyMarkets'
import BorrowMarkets from '../../components/BorrowMarkets'
import { CToken, useCTokens } from '../../data/CToken'
// import { utils } from 'ethers'
import { useAllLendBalances } from '../../state/wallet/hooks'
import { getBorrowTotalBalance, getLimit, getNetApy, getSupplyTotalBalance } from '../../utils'
// import { RowBetween } from '../../components/Row'
// import Loader from '../../components/Loader'

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

export default function Lend() {
  const tokenBalances = useAllLendBalances()

  const allMarkets = useCTokens()

  const allMarketsAsset: CToken[] = allMarkets.map((item: any) => {
    return {
      ...item?.[1]
    }
  })

  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <Summary
          allMarkets={allMarkets}
          supplyTotalBalance={getSupplyTotalBalance(allMarketsAsset)}
          borrowTotalBalance={getBorrowTotalBalance(allMarketsAsset)}
          limit={getLimit(allMarketsAsset)}
          netApy={getNetApy(allMarketsAsset)}
        ></Summary>
        <MarketsWrap>
          <SupplyMarkets
            allMarkets={allMarkets}
            tokenBalances={tokenBalances}
            borrowTotalBalance={getBorrowTotalBalance(allMarketsAsset)}
            limit={getLimit(allMarketsAsset)}
          ></SupplyMarkets>
          <BorrowMarkets
            allMarkets={allMarkets}
            tokenBalances={tokenBalances}
            limit={getLimit(allMarketsAsset)}
          ></BorrowMarkets>
        </MarketsWrap>
      </PageWrapper>
    </>
  )
}
