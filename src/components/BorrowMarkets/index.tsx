import React, { useState } from 'react'
import styled from 'styled-components'
import CurrencyIcon from '../CurrencyIcon'
import LendModal from '../LendModal'
import { CToken } from '../../data/CToken'
import { LendField } from '../../state/lending/actions'
import { balanceFormat, getBorrowTotalBalance } from '../../utils'
import { BigNumber } from '@ethersproject/bignumber'
import { useAllCTokenBalances } from '../../state/wallet/hooks'
import { useCTokenApproveCallback } from '../../hooks/useApproveCallback'
import { JSBI, TokenAmount } from '@uniswap/sdk'

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

function ItemPannel({ marketCToken, children }: { marketCToken: CToken; children: React.ReactNode }) {
  useCTokenApproveCallback(marketCToken, marketCToken?.cAddress)
  return <>{children}</>
}

function BorrowMarkets({
  allMarketCTokens = [],
  borrowTotalBalance,
  limit
}: {
  allMarketCTokens: CToken[]
  borrowTotalBalance: number
  limit: number
}) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  const [lendToken, setLendToken] = useState<CToken>()

  const [showLendConfirmation, setShowLendConfirmation] = useState(false)

  const borrowedAsset = allMarketCTokens.filter((item: CToken) => {
    return item.borrowBalance && BigNumber.from(0).lt(item.borrowBalance)
  })

  const borrowAsset = allMarketCTokens.filter((item: CToken) => {
    return (
      (!item.borrowBalance || BigNumber.from(0).eq(item.borrowBalance)) &&
      (!item.supplyBalance || BigNumber.from(0).eq(item.supplyBalance))
    )
  })

  // console.log(borrowedAsset, 'borrowedAsset')
  // const testtotalbalance = getBorrowTotalBalance(borrowedAsset)

  // console.log(testtotalbalance.toSignificant(6), 'testtotalbalance')

  const borrowAssetCurrencyAmount = useAllCTokenBalances(borrowAsset)

  return (
    <div>
      <LendModal
        lendToken={lendToken}
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
              {borrowedAsset.map((item: CToken) => (
                <ItemPannel marketCToken={item} key={item?.symbol}>
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
                        {new TokenAmount(item, item.getBorrowBalanceAmount()).toSignificant()}
                        {' ' + item?.symbol}
                      </ItemBottomWrap>
                    </ItemWrap>
                    <ItemWrap>{((getBorrowTotalBalance([item]) / limit) * 100).toFixed(1) ?? ''}%</ItemWrap>
                  </AssetItem>
                </ItemPannel>
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
              ? borrowAsset.map((item: any, index) => (
                  <ItemPannel marketCToken={item} key={item?.symbol}>
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
                        {borrowAssetCurrencyAmount?.[index]?.toSignificant(4)}
                        {' ' + item?.symbol}
                      </ItemWrap>
                      <ItemWrap>
                        {JSBI.greaterThan(
                          item?.getLiquidity(),
                          JSBI.multiply(JSBI.BigInt('1000'), balanceFormat(item?.decimals))
                        )
                          ? '> 1000'
                          : JSBI.lessThan(
                              item?.getLiquidity(),
                              JSBI.multiply(JSBI.BigInt('1'), balanceFormat(item?.decimals))
                            )
                          ? '< 1'
                          : new TokenAmount(item, item?.getLiquidity()).toSignificant()}
                        K
                      </ItemWrap>
                    </AssetItem>
                  </ItemPannel>
                ))
              : ''}
          </AssetItemWrap>
        </AssetWrap>
      </MarketsCard>
    </div>
  )
}

export default BorrowMarkets
