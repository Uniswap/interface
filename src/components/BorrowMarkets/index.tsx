import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import CurrencyIcon from '../CurrencyIcon'
import LendModal from '../LendModal'
import { CToken } from '../../data/CToken'
import { LendField } from '../../state/lending/actions'
import { APY_BASE, formatData, getBorrowTotalBalance, showDollarValue } from '../../utils'
import { BigNumber } from '@ethersproject/bignumber'
import { useCTokenApproveCallback } from '../../hooks/useApproveCallback'
import { Fraction, JSBI, TokenAmount } from '@uniswap/sdk'
import DoubleAssetLogo from '../DoubleAssetLogo'
import { useTranslation } from 'react-i18next'

const MarketsCard = styled.div`
  background: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text1};
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
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
    font-size: 1rem;
  `};
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
  grid-template-columns: 4fr 2fr 4fr 3fr;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 4fr 4fr 3fr;
    padding: 0.8rem 1rem;
  `};
`

const AssetLabel = styled.div<{ textAlign?: string; mobileHide?: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: #aab8c1;
  text-align: ${({ textAlign }) => (textAlign ? textAlign : 'center')};
  ${({ theme, mobileHide }) => theme.mediaWidth.upToMedium`
    display: ${mobileHide ? 'none' : 'block'};
  `};
`

const AssetItemWrap = styled.div`
  font-size: 1rem;
`

const AssetItem = styled.div<{ justifyItems?: string }>`
  display: grid;
  justify-items: ${({ justifyItems }) => (justifyItems ? justifyItems : 'end')};
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.25rem 1.75rem;
  border-left: 2px solid transparent;
  padding-left: 1.625rem;
  height: 78px;
  text-transform: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
  transition: none;
  grid-template-columns: 4fr 2fr 4fr 3fr;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 4fr 4fr 3fr;
    padding: 0.8rem 1rem;
  `};
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

const ItemWrap = styled.div<{ mobileHide?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: right;
  align-self: center;
  text-align: right;
  ${({ theme, mobileHide }) => theme.mediaWidth.upToMedium`
    display: ${mobileHide ? 'none' : 'flex'};
    font-size: 0.8rem;
  `};
`

const ItemBottomWrap = styled.div`
  color: #aab8c1;
  font-size: 0.9em;
`

const MobileWrap = styled.div`
  display: none;
  color: #aab8c1;
  text-align: left;
  font-size: 0.9em;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: block;
  `};
`

const SymbolWrap = styled.div`
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 6rem;
`

function ItemPannel({
  marketCToken,
  walletBalances,
  children
}: {
  marketCToken: CToken
  walletBalances: {
    [tokenAddress: string]: TokenAmount | undefined
  }
  children: React.ReactNode
}) {
  useCTokenApproveCallback(marketCToken, walletBalances, marketCToken?.cAddress)
  return <>{children}</>
}

const ZERO = JSBI.BigInt(0)

export function getBorrowApy(ctoken: CToken): Fraction {
  return new Fraction(ctoken.getBorrowApy() ?? ZERO, APY_BASE)
}

function BorrowMarkets({
  allMarketCTokens = [],
  borrowTotalBalance,
  limit,
  usedLimit,
  walletBalances
}: {
  allMarketCTokens: CToken[]
  borrowTotalBalance: JSBI
  limit: JSBI
  usedLimit: Fraction
  walletBalances: {
    [tokenAddress: string]: TokenAmount | undefined
  }
}) {
  const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  const [lendToken, setLendToken] = useState<CToken>()

  const [showLendConfirmation, setShowLendConfirmation] = useState(false)

  const [TokenLoadState, setTokenLoadState] = useState(false)

  useEffect(() => {
    if (allMarketCTokens[0].underlyingPrice) {
      setTokenLoadState(true)
    } else {
      setTokenLoadState(false)
    }
  }, [allMarketCTokens])

  const borrowedAsset = allMarketCTokens.filter((item: CToken) => {
    return item.borrowBalance && BigNumber.from(0).lt(item.borrowBalance)
  })

  const borrowAsset = allMarketCTokens.filter((item: CToken) => {
    return (
      (!item.borrowBalance || BigNumber.from(0).eq(item.borrowBalance)) &&
      (!item.supplyBalance || BigNumber.from(0).eq(item.supplyBalance))
    )
  })

  return (
    <div>
      <LendModal
        lendToken={lendToken}
        walletBalances={walletBalances}
        showLendConfirmation={showLendConfirmation}
        setShowLendConfirmation={setShowLendConfirmation}
        borrowTotalBalance={borrowTotalBalance}
        limit={limit}
        usedLimit={usedLimit}
        lendMarket={LendField.BORROW}
      />
      {!!borrowedAsset.length && (
        <MarketsCard style={{ marginBottom: '1rem' }}>
          <MarketsCardHeader>{t('borrowingMarkets')}</MarketsCardHeader>
          <AssetWrap>
            <AssetWrapLabels>
              <AssetLabel textAlign={'left'}>{t('asset')}</AssetLabel>
              <AssetLabel textAlign={'right'} mobileHide={true}>
                {t('APY')}
              </AssetLabel>
              <AssetLabel textAlign={'right'}>{t('assetBalance')}</AssetLabel>
              <AssetLabel textAlign={'right'}>{t('percentOfLimit')}</AssetLabel>
            </AssetWrapLabels>
            <AssetItemWrap>
              {borrowedAsset.map((item: CToken) => (
                <ItemPannel marketCToken={item} walletBalances={walletBalances} key={item.symbol}>
                  <AssetItem
                    key={item.symbol}
                    onClick={() => {
                      if (TokenLoadState) {
                        setLendToken(item)
                        setShowLendConfirmation(true)
                      }
                    }}
                  >
                    <AssetLogo>
                      {item.logo1 ? (
                        <DoubleAssetLogo logo0={item.logo0} logo1={item.logo1} size={24} />
                      ) : (
                        <CurrencyIcon logo0={item.logo0} style={{ marginRight: '10px' }} />
                      )}
                      <ItemWrap>
                        <SymbolWrap>{item.name}</SymbolWrap>
                        <MobileWrap>{getBorrowApy(item).toFixed(2) ?? 0}%</MobileWrap>
                      </ItemWrap>
                    </AssetLogo>
                    <ItemWrap mobileHide={true}>
                      <div>{getBorrowApy(item).toFixed(2) ?? 0}%</div>
                    </ItemWrap>
                    <ItemWrap>
                      <div>${formatData(getBorrowTotalBalance([item])).toFixed(2) ?? ''}</div>
                      <ItemBottomWrap>
                        {new TokenAmount(item, item.getBorrowBalanceAmount()).toSignificant()}
                        {' ' + item.symbol}
                      </ItemBottomWrap>
                    </ItemWrap>
                    <ItemWrap>
                      {new Fraction(getBorrowTotalBalance([item]), limit).multiply(JSBI.BigInt(100)).toFixed(1) ?? ''}%
                    </ItemWrap>
                  </AssetItem>
                </ItemPannel>
              ))}
            </AssetItemWrap>
          </AssetWrap>
        </MarketsCard>
      )}
      <MarketsCard>
        <AssetWrap>
          <MarketsCardHeader>{t('borrowMarkets')}</MarketsCardHeader>
          <AssetWrapLabels>
            <AssetLabel textAlign={'left'}>{t('asset')}</AssetLabel>
            <AssetLabel textAlign={'right'} mobileHide={true}>
              {t('APY')}
            </AssetLabel>
            <AssetLabel textAlign={'right'}>{t('assetWallet')}</AssetLabel>
            <AssetLabel textAlign={'right'}>{t('liquidity')}</AssetLabel>
          </AssetWrapLabels>
          <AssetItemWrap>
            {!!borrowAsset.length
              ? borrowAsset.map((item: CToken) => (
                  <ItemPannel marketCToken={item} walletBalances={walletBalances} key={item.symbol}>
                    <AssetItem
                      key={item.symbol}
                      onClick={() => {
                        if (TokenLoadState) {
                          setLendToken(item)
                          setShowLendConfirmation(true)
                        }
                      }}
                    >
                      <AssetLogo>
                        {item.logo1 ? (
                          <DoubleAssetLogo logo0={item.logo0} logo1={item.logo1} size={24} />
                        ) : (
                          <CurrencyIcon logo0={item.logo0} style={{ marginRight: '10px' }} />
                        )}
                        <ItemWrap>
                          <SymbolWrap>{item.name}</SymbolWrap>
                          <MobileWrap>{getBorrowApy(item).toFixed(2) ?? 0}%</MobileWrap>
                        </ItemWrap>
                      </AssetLogo>
                      <ItemWrap mobileHide={true}>
                        <div>{getBorrowApy(item).toFixed(2) ?? 0}%</div>
                      </ItemWrap>
                      <ItemWrap>
                        {walletBalances[item.address]?.toSignificant(4) ?? '0'}
                        {' ' + item.symbol}
                      </ItemWrap>
                      <ItemWrap>${showDollarValue(item.getLiquidityValue())}</ItemWrap>
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
