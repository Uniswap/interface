import React, { useState } from 'react'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import Switch from '../Switch'
import styled from 'styled-components'
// import { utils } from 'ethers'
import CurrencyIcon from '../CurrencyIcon'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import { Text } from 'rebass'
import { RowBetween } from '../Row'
import { X } from 'react-feather'
import { CToken } from '../../data/CToken'
import { ButtonLight } from '../Button'
import LendModal from '../LendModal'
import { TokenAmount } from '@uniswap/sdk'
import { calculateGasMargin, getComptrollerContract, getSuppliedValue, getSupplyApy, getSupplyBalanceAmount, getSupplyTotalBalance } from '../../utils'
import { useActiveWeb3React } from '../../hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import ReactGA from 'react-ga'
import { LendField } from '../../state/lending/actions'

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
  tokenBalances,
  borrowTotalBalance,
  limit
}: {
  allMarkets: any
  tokenBalances: { [tokenAddress: string]: TokenAmount | undefined }
  borrowTotalBalance: number
  limit: number
}) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  // show confirmation view before turning on

  const { account, chainId, library } = useActiveWeb3React()

  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  console.log('use txHash and attemptingTxn later like Add Liquidity', attemptingTxn, txHash)

  const addTransaction = useTransactionAdder()

  async function onEnterMarkets(cToken: CToken) {
    if (!chainId || !library || !account) return
    const comptroller = getComptrollerContract(chainId, library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    estimate = comptroller.estimateGas.enterMarkets
    method = comptroller.enterMarkets
    args = [[cToken.cAddress]]
    value = null

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Enter ' + cToken.symbol + ' as Collateral'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Collateral',
            action: 'Enter',
            label: cToken.symbol
          })
        })
      )
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  async function onExitMarkets(cToken: CToken) {
    if (!chainId || !library || !account) return
    const comptroller = getComptrollerContract(chainId, library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    estimate = comptroller.estimateGas.exitMarket
    method = comptroller.exitMarket
    args = [cToken.cAddress]
    value = null

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Exit ' + cToken.symbol + ' as Collateral'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Collateral',
            action: 'Exit',
            label: cToken.symbol
          })
        })
      )
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const [showCollateralConfirmation, setShowCollateralConfirmation] = useState(false)

  const [collateralToken, setCollateralToken] = useState<CToken>()

  const [lendToken, setLendToken] = useState<CToken>({} as CToken)

  const [showLendConfirmation, setShowLendConfirmation] = useState(false)

  const [isSuppliedMarkets, setIsSuppliedMarkets] = useState(false)

  const supplyList = allMarkets.map((item: any) => {
    return item?.[1]
  })

  const suppliedAsset = supplyList.filter((item: any) => {
    return item && item?.supplyBalance?.toString() > 0
  })

  const supplyAsset = supplyList.filter((item: any) => {
    return item && item?.supplyBalance?.toString() === '0' && item?.borrowBalance?.toString() === '0'
  })

  function canExitMarkets(): boolean {
    if (
      collateralToken &&
      collateralToken.supplyBalance &&
      collateralToken?.exchangeRateMantissa &&
      collateralToken?.underlyingPrice &&
      collateralToken?.collateralFactorMantissa
    ) {
      if (limit - getSuppliedValue(collateralToken) ?? 0 < borrowTotalBalance) {
        return false
      } else {
        return true
      }
    } else {
      return false
    }
  }

  console.log(canExitMarkets(), 'canExitMarkets')
  return (
    <div>
      <LendModal
        lendToken={lendToken}
        tokenBalances={tokenBalances}
        showLendConfirmation={showLendConfirmation}
        setShowLendConfirmation={setShowLendConfirmation}
        lendMarket={LendField.SUPPLY}
      />
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
              {collateralToken?.canBeCollateral && canExitMarkets() ? (
                <Text fontWeight={400} fontSize={'1rem'}>
                  This asset will no longer be used towards your borrowing limit, and can’t be seized in liquidation.
                </Text>
              ) : collateralToken?.canBeCollateral ? (
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
                      if (canExitMarkets()) {
                        onExitMarkets(collateralToken)
                        setShowCollateralConfirmation(false)
                      } else {
                        return setShowCollateralConfirmation(false)
                      }
                    } else {
                      onEnterMarkets(collateralToken)
                      setShowCollateralConfirmation(false)
                    }
                  } else {
                    return
                  }
                }}
              >
                {collateralToken?.canBeCollateral && canExitMarkets()
                  ? 'DISABLE ' + collateralToken?.symbol
                  : collateralToken?.canBeCollateral
                  ? 'DISMISS'
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
              <AssetLabel textAlign={'right'}>APY</AssetLabel>
              <AssetLabel textAlign={'right'}>Balance</AssetLabel>
              <AssetLabel textAlign={'right'}>Collateral</AssetLabel>
            </AssetWrapLabels>
            <AssetItemWrap onClick={() => setShowLendConfirmation(true)}>
              {suppliedAsset.map((item: any) => (
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
                    <div>{getSupplyApy(item).toFixed(2) ?? 0}%</div>
                  </ItemWrap>
                  <ItemWrap>
                    <div>${getSupplyTotalBalance([item]).toFixed(2) ?? ''}</div>
                    <ItemBottomWrap>
                      {parseFloat(getSupplyBalanceAmount(item)).toFixed(4) ?? ''}
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
                      <div>{getSupplyApy(item).toFixed(2) ?? 0}%</div>
                    </ItemWrap>
                    <ItemWrap>
                      {tokenBalances?.[item?.address]?.toSignificant()}
                      {' ' + item?.symbol}
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
