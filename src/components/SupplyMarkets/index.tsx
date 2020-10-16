import React, { useState } from 'react'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import Switch from '../Switch'
import styled from 'styled-components'
import { utils } from 'ethers'
import CurrencyIcon from '../CurrencyIcon'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import { Text } from 'rebass'
import { RowBetween } from '../Row'
import { X } from 'react-feather'
import { CToken } from '../../data/CToken'
import { ButtonLight } from '../Button'
import { blocksPerDay, daysPerYear, ethMantissa } from '../Summary'

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

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
  height: 82px;
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

const Break = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`

const ModalContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 20px;
`

function SupplyMarkets({
  allMarkets = [],
  onEnterMarkets,
  onExitMarkets
}: {
  allMarkets: any
  onEnterMarkets: (cToken: CToken) => void
  onExitMarkets: (cToken: CToken) => void
}) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  // show confirmation view before turning on
  const [showCollateralConfirmation, setShowCollateralConfirmation] = useState(false)

  const [collateralToken, setCollateralToken] = useState<CToken>()

  const [isSuppliedMarkets, setIsSuppliedMarkets] = useState(false)

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
      <Modal isOpen={showCollateralConfirmation} onDismiss={() => setShowCollateralConfirmation(false)}>
        <ModalContentWrapper>
          <AutoColumn gap="lg">
            <RowBetween style={{ padding: '0 2rem' }}>
              <div />
              <Text fontWeight={500} fontSize={'1.1rem'}>
                {collateralToken?.canBeCollateral
                  ? 'Disable As Collateral'
                  : isSuppliedMarkets
                  ? 'Collateral Required'
                  : 'Enable As Collateral'}
              </Text>
              <StyledCloseIcon onClick={() => setShowCollateralConfirmation(false)} />
            </RowBetween>
            <Break />
            <AutoColumn gap="md" style={{ padding: '0 2rem' }}>
              {collateralToken?.canBeCollateral ? (
                <Text fontWeight={400} fontSize={'1rem'}>
                  This asset will no longer be used towards your borrowing limit, and can’t be seized in liquidation.
                </Text>
              ) : isSuppliedMarkets ? (
                <Text fontWeight={400} fontSize={'1rem'}>
                  This asset is required to support your borrowed assets. Either repay borrowed assets, or supply
                  another asset as collateral.
                </Text>
              ) : (
                <Text fontWeight={400} fontSize={'1rem'}>
                  Each asset used as collateral increases your borrowing limit. Be careful, this can subject the asset
                  to being seized in liquidation.
                </Text>
              )}
            </AutoColumn>
            <AutoColumn gap="md" style={{ padding: '0 2rem' }}>
              <ButtonLight
                onClick={() => {
                  if (collateralToken) {
                    if (collateralToken.canBeCollateral) {
                      onExitMarkets(collateralToken)
                      setShowCollateralConfirmation(false)
                    } else {
                      onEnterMarkets(collateralToken)
                      setShowCollateralConfirmation(false)
                    }
                  } else {
                    return
                  }
                }}
              >
                {collateralToken?.canBeCollateral
                  ? 'DISABLE ' + collateralToken?.symbol
                  : 'USE ' + collateralToken?.symbol + ' AS COLLATEERAL'}
              </ButtonLight>
            </AutoColumn>
          </AutoColumn>
        </ModalContentWrapper>
      </Modal>
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
                  <AssetLogo>
                    <CurrencyIcon address={item?.address} style={{ marginRight: '10px' }} />
                    {item?.symbol}
                  </AssetLogo>
                  <ItemWrap>
                    <div>
                      {(
                        (Math.pow((item?.supplyRatePerBlock / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                    <ItemBottomWrap>
                      {item?.supplyBalance && item?.symbol
                        ? parseFloat(utils.formatEther(item?.supplyBalance)).toFixed(4)
                        : ''}
                      {' ' + item?.symbol}
                    </ItemBottomWrap>
                  </ItemWrap>
                  <ItemWrap>
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
                    <ItemBottomWrap>
                      {item?.supplyBalance && item?.symbol
                        ? (
                            parseFloat(utils.formatEther(item?.supplyBalance)) *
                            parseFloat(utils.formatEther(item?.exchangeRateMantissa))
                          ).toFixed(4)
                        : ''}
                      {' ' + item?.symbol}
                    </ItemBottomWrap>
                  </ItemWrap>
                  <Switch
                    isActive={item?.canBeCollateral}
                    toggle={() => {
                      setCollateralToken(item)
                      setIsSuppliedMarkets(true)
                      setShowCollateralConfirmation(true)
                    }}
                  />
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
                    <AssetLogo>
                      <CurrencyIcon address={item?.address} style={{ marginRight: '10px' }} />
                      {item?.symbol}
                    </AssetLogo>
                    <ItemWrap>
                      <div>
                        {(
                          (Math.pow((item?.supplyRatePerBlock / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1) *
                          100
                        ).toFixed(2)}
                        %
                      </div>
                    </ItemWrap>
                    <ItemWrap>
                      $
                      {item?.supplyBalance && item?.exchangeRateMantissa && item?.underlyingPrice
                        ? (
                            parseFloat(utils.formatEther(item?.supplyBalance)) *
                            parseFloat(utils.formatEther(item?.exchangeRateMantissa)) *
                            parseFloat(utils.formatEther(item?.underlyingPrice))
                          ).toFixed(2)
                        : ''}
                    </ItemWrap>
                    <Switch
                      isActive={item?.canBeCollateral}
                      toggle={() => {
                        setCollateralToken(item)
                        setIsSuppliedMarkets(false)
                        setShowCollateralConfirmation(true)
                      }}
                    />
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
