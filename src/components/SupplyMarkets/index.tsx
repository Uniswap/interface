import React from 'react'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import Switch from '../Switch'
import styled from 'styled-components'
import { utils } from 'ethers'

const MarketsCard = styled.div`
  background: #ffffff;
  box-shadow: 0px 2px 4px rgba(16, 21, 24, 0.05);
  border-radius: 4px;
`

const MarketsCardHeader = styled.div`
  display: flex;
  flex-flow: inherit;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  padding: 1rem 1.75rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`

const AssetWrap = styled.div`
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
const ethMantissa = 1e18
const blocksPerDay = 4 * 60 * 24
const daysPerYear = 365

function SupplyMarkets({ allMarkets = [] }: { allMarkets: any }) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()
  const supplyList = allMarkets.map((item: any) => {
    return item?.[1]
  })

  const suppliedAsset = supplyList.filter((item: any) => {
    return item && item?.supplyBalance?.toString() > 0
  })

  const supplyAsset = supplyList.filter((item: any) => {
    return item && item?.supplyBalance?.toString() == 0 && item?.borrowBalance?.toString() == 0
  })

  return (
    <div>
      {!!suppliedAsset.length && (
        <MarketsCard style={{ marginBottom: '1rem' }}>
          <MarketsCardHeader>Supply</MarketsCardHeader>
          <AssetWrap>
            <AssetWrapLabels>
              <AssetLabel textAlign={'left'}>Asset</AssetLabel>
              <AssetLabel textAlign={'right'}>APY / Earned</AssetLabel>
              <AssetLabel textAlign={'right'}>Balance</AssetLabel>
              <AssetLabel textAlign={'right'}>Collateral</AssetLabel>
            </AssetWrapLabels>
            <AssetItemWrap>
              {suppliedAsset.map((item: any) => (
                <AssetItem key={item?.symbol}>
                  <div style={{ justifySelf: 'start' }}>{item?.symbol}</div>
                  <div>
                    {(
                      (Math.pow((item?.supplyRatePerBlock / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1) *
                      100
                    ).toFixed(2)}
                    %
                  </div>
                  <div>
                    $
                    {item?.supplyBalance && item?.exchangeRateMantissa && item?.underlyingPrice
                      ? (
                          parseFloat(utils.formatEther(item?.supplyBalance)) *
                          parseFloat(utils.formatEther(item?.exchangeRateMantissa)) *
                          parseFloat(utils.formatEther(item?.underlyingPrice))
                        ).toFixed(3)
                      : ''}
                  </div>
                  <Switch isActive={item?.canBeCollateral} />
                </AssetItem>
              ))}
            </AssetItemWrap>
          </AssetWrap>
        </MarketsCard>
      )}
      <MarketsCard>
        <MarketsCardHeader>Supply Markets</MarketsCardHeader>
        <AssetWrap>
          <AssetWrapLabels>
            <AssetLabel textAlign={'left'}>Asset</AssetLabel>
            <AssetLabel textAlign={'right'}>APY</AssetLabel>
            <AssetLabel textAlign={'right'}>Wallet</AssetLabel>
            <AssetLabel textAlign={'right'}>Collateral</AssetLabel>
          </AssetWrapLabels>
          <AssetItemWrap>
            {!!supplyAsset.length
              ? supplyAsset.map((item: any) => (
                  <AssetItem key={item?.symbol}>
                    <div style={{ justifySelf: 'start' }}>{item?.symbol}</div>
                    <div>
                      {(
                        (Math.pow((item?.supplyRatePerBlock / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                    <div>
                      $
                      {item?.supplyBalance && item?.exchangeRateMantissa && item?.underlyingPrice
                        ? (
                            parseFloat(utils.formatEther(item?.supplyBalance)) *
                            parseFloat(utils.formatEther(item?.exchangeRateMantissa)) *
                            parseFloat(utils.formatEther(item?.underlyingPrice))
                          ).toFixed(2)
                        : ''}
                    </div>
                    <Switch isActive={item?.canBeCollateral} />
                  </AssetItem>
                ))
              : ''}
          </AssetItemWrap>
        </AssetWrap>
      </MarketsCard>
    </div>
  )
}

export default SupplyMarkets
