// import { utils } from 'ethers'
import React, { useState } from 'react'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import styled from 'styled-components'
import CurrencyIcon from '../CurrencyIcon'
import LendModal from '../LendModal'
import { CToken } from '../../data/CToken'
import { TokenAmount } from '@uniswap/sdk'
import { LendField } from '../../state/lending/actions'
import { getBorrowTotalBalance } from '../../utils'
import { BigNumber } from '@ethersproject/bignumber'

const MarketsCard = styled.div`
  background: #ffffff;
  box-shadow: 0px 2px 4px rgba(16, 21, 24, 0.05);
  border-radius: 4px;
`

const MarketsCardHeader = styled.div`
  display: flex;
  flex-flow: inherit;
  font-weight: 600;
  justify-content: space-between;
  font-size: 1.1rem;
  padding: 1rem 1.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`

const AssetWrap = styled.div`
  cursor: pointer;
  font-size: 1rem;
`

const AssetWrapLabels = styled.div`
  display: grid;
  padding: 1rem 1.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  align-items: center;
  grid-template-columns: 4fr 3fr 3fr 2fr;
`

const AssetLabel = styled.div<{ textAlign?: string }>`
  font-size: 12px;
  font-weight: 500;
  color: #aab8c1;
  text-align: ${({ textAlign }) => (textAlign ? textAlign : 'center')};
`

const AssetItemWrap = styled.div`
  font-size: 1rem;
`

const AssetItem = styled.div<{ justifyItems?: string }>`
  display: grid;
  justify-items: ${({ justifyItems }) => (justifyItems ? justifyItems : 'end')};
  grid-template-columns: 4fr 3fr 3fr 2fr;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.25rem 1.75rem;
  border-left: 2px solid transparent;
  padding-left: 1.625rem;
  height: 82px;
  text-transform: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
  transition: none;
  :hover {
    border-left: 2px solid #1de9b6;
    background: rgba(4, 169, 245, 0.05);
  }
`

const AssetLogo = styled.div`
  display: flex;
  align-items: center;
  justify-self: start;
`

const ItemWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: right;
  align-self: center;
  text-align: right;
`

const ItemBottomWrap = styled.div`
  color: #aab8c1;
  font-size: 0.9em;
`

function BorrowMarkets({
  allMarketCTokens = [],
  tokenBalances,
  borrowTotalBalance,
  limit
}: {
  allMarketCTokens: CToken[]
  tokenBalances: { [tokenAddress: string]: TokenAmount | undefined }
  borrowTotalBalance: number
  limit: number
}) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  const [lendToken, setLendToken] = useState<CToken>({} as CToken)

  const [showLendConfirmation, setShowLendConfirmation] = useState(false)

  const borrowedAsset = allMarketCTokens.filter((item: CToken) => {
    return item.borrowBalance && BigNumber.from(0).lt(item.borrowBalance)
  })

  const borrowAsset = allMarketCTokens.filter((item: CToken) => {
    return (
      item.borrowBalance &&
      BigNumber.from(0).eq(item.borrowBalance) &&
      item.supplyBalance &&
      BigNumber.from(0).eq(item.supplyBalance)
    )
  })

  return (
    <div>
      <LendModal
        lendToken={lendToken}
        tokenBalances={tokenBalances}
        showLendConfirmation={showLendConfirmation}
        setShowLendConfirmation={setShowLendConfirmation}
        borrowTotalBalance={borrowTotalBalance}
        limit={limit}
        lendMarket={LendField.BORROW}
      />
      {!!borrowedAsset.length && (
        <MarketsCard style={{ marginBottom: '1rem' }}>
          <MarketsCardHeader>Borrow</MarketsCardHeader>
          <AssetWrap>
            <AssetWrapLabels>
              <AssetLabel textAlign={'left'}>Asset</AssetLabel>
              <AssetLabel textAlign={'right'}>APY</AssetLabel>
              <AssetLabel textAlign={'right'}>Balance</AssetLabel>
              <AssetLabel textAlign={'right'}>% Of Limit</AssetLabel>
            </AssetWrapLabels>
            <AssetItemWrap>
              {borrowedAsset.map((item: any) => (
                <AssetItem
                  key={item?.symbol}
                  onClick={() => {
                    setLendToken(item)
                    setShowLendConfirmation(true)
                  }}
                >
                  <AssetLogo>
                    <CurrencyIcon address={item?.address} style={{ marginRight: '10px' }} />
                    {item?.symbol}
                  </AssetLogo>
                  <ItemWrap>
                    <div>{item.getBorrowApy().toFixed(2) ?? 0}%</div>
                  </ItemWrap>
                  <ItemWrap>
                    <div>${getBorrowTotalBalance([item]).toFixed(2) ?? ''}</div>
                    <ItemBottomWrap>
                      {parseFloat(item.getBorrowBalanceAmount()).toFixed(4) ?? ''}
                      {' ' + item?.symbol}
                    </ItemBottomWrap>
                  </ItemWrap>
                  <ItemWrap>{((getBorrowTotalBalance([item]) / limit) * 100).toFixed(0) ?? ''}%</ItemWrap>
                </AssetItem>
              ))}
            </AssetItemWrap>
          </AssetWrap>
        </MarketsCard>
      )}
      <MarketsCard>
        <AssetWrap>
          <MarketsCardHeader>Borrow Markets</MarketsCardHeader>
          <AssetWrapLabels>
            <AssetLabel textAlign={'left'}>Asset</AssetLabel>
            <AssetLabel textAlign={'right'}>APY</AssetLabel>
            <AssetLabel textAlign={'right'}>Wallet</AssetLabel>
            <AssetLabel textAlign={'right'}>Liquidity</AssetLabel>
          </AssetWrapLabels>
          <AssetItemWrap>
            {!!borrowAsset.length
              ? borrowAsset.map((item: any) => (
                  <AssetItem
                    key={item?.symbol}
                    onClick={() => {
                      setLendToken(item)
                      setShowLendConfirmation(true)
                    }}
                  >
                    <AssetLogo>
                      <CurrencyIcon address={item?.address} style={{ marginRight: '10px' }} />
                      {item?.symbol}
                    </AssetLogo>
                    <ItemWrap>
                      <div>{item.getBorrowApy().toFixed(2) ?? 0}%</div>
                    </ItemWrap>
                    <ItemWrap>
                      {tokenBalances?.[item?.address]?.toSignificant()}
                      {' ' + item?.symbol}
                    </ItemWrap>
                    <ItemWrap>{item.getLiquidity() < 100 ? item.getLiquidity().toFixed(1) : '< 0.1'}K</ItemWrap>
                  </AssetItem>
                ))
              : ''}
          </AssetItemWrap>
        </AssetWrap>
      </MarketsCard>
    </div>
  )
}

export default BorrowMarkets
