import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import { Text } from 'rebass'
import { AutoRow, RowBetween } from '../Row'
import { ArrowRight, X } from 'react-feather'
import { CToken } from '../../data/CToken'
import { ButtonLight } from '../Button'
import CurrencyIcon from '../CurrencyIcon'
import LendInputPanel from '../LendInputPanel'
import { Dots } from '../swap/styleds'

import { ApprovalState, useCTokenApproveCallback } from '../../hooks/useApproveCallback'
import {
  calculateGasMargin,
  formatData,
  EXA_BASE,
  getCERC20Contract,
  getCEtherContract,
  LIMIT_BASE,
  getMaximillionContract
} from '../../utils'
import { useActiveWeb3React } from '../../hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import ReactGA from 'react-ga'
import { LendField } from '../../state/lending/actions'
import MarketBar from '../MarketBar'
import { tryParseAmount } from '../../state/swap/hooks'
import { cTokenMaxAmountSpend } from '../../utils/maxAmountSpend'
import { CurrencyAmount, Fraction, JSBI, TokenAmount } from '@uniswap/sdk'
import { useLendingInfo } from '../../state/lending/hooks'
import DoubleAssetLogo from '../DoubleAssetLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from '../TransactionConfirmationModal'
import { getSupplyApy } from '../SupplyMarkets'
import { getBorrowApy } from '../BorrowMarkets'
import { useTranslation } from 'react-i18next'

const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)
const EIGHT = JSBI.BigInt(8)
const TEN = JSBI.BigInt(10)
const ZERO_FRACTION = new Fraction(ZERO, ONE)

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

const AssetLogo = styled.div`
  display: flex;
  align-items: center;
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
  border-radius: 4px;
  width: 100%;
`

const ApproveWrap = styled.div`
  background: ${({ theme }) => theme.bg1};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.75rem;
`

const TabWrap = styled.div`
  background: ${({ theme }) => theme.bg1};
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  user-select: none;
`

const TabItem = styled.div<{ isActive: boolean }>`
  font-size: 0.85rem;
  text-align: center;
  position: relative;
  cursor: pointer;
  text-transform: uppercase;
  color: ${({ isActive, theme }) => (isActive ? theme.primary1 : '#AAB8C1')};
  padding-bottom: 0.8rem;
  font-weight: 600;
  :after {
    background: ${({ isActive, theme }) => (isActive ? theme.primary1 : 'none')};
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 10px 10px 0 0;
  }
`

const RateWrap = styled.div`
  padding: 1.2rem 1.75rem 0;
  width: 100%;
`

const RateTitle = styled.div`
  cursor: pointer;
  text-transform: none;
  color: #657786;
  font-weight: 600;
  font-size: 12px;
`

const RatePanel = styled.div`
  display: flex;
  color: ${({ theme }) => theme.text2};
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 0;
`

const RateCalculation = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
`

export interface LendModalProps {
  lendToken: CToken | undefined
  walletBalances: {
    [tokenAddress: string]: TokenAmount | undefined
  }
  showLendConfirmation: boolean
  setShowLendConfirmation: Function
  borrowTotalBalance: JSBI
  limit: JSBI
  usedLimit: Fraction
  lendMarket?: LendField
}

function LendModal({
  lendToken,
  walletBalances,
  showLendConfirmation,
  setShowLendConfirmation,
  borrowTotalBalance,
  limit,
  usedLimit,
  lendMarket
}: LendModalProps) {
  const { t } = useTranslation()

  const { account, chainId, library } = useActiveWeb3React()

  // modal and confirm
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  console.log('use txHash and attemptingTxn later like Add Liquidity', attemptingTxn, txHash)

  const walletBalanceAmount = walletBalances[lendToken?.address ?? '']

  const addTransaction = useTransactionAdder()

  const [tabItemActive, setTabItemActive] = useState<LendField>()

  const [lendInputValue, setLendInputValue] = useState('')

  const [pendingText, setPendingText] = useState('')

  const [approvalTokenStatus, approveCallback, approveHash, approvePendingText] = useCTokenApproveCallback(
    lendToken,
    walletBalances,
    lendToken?.cAddress,
    setAttemptingTxn
  )

  useEffect(() => {
    setTxHash(approveHash)
    setPendingText(approvePendingText)
  }, [approveHash, approvePendingText])

  const inputAmount = useMemo(() => tryParseAmount(lendInputValue, lendToken), [lendToken, lendInputValue])

  const changedBorrowLimit = useMemo(() => {
    if (lendToken && lendInputValue) {
      const price = lendToken.getUnderlyingPrice()
      const parseInputAmount = JSBI.BigInt(inputAmount ? inputAmount.raw.toString() : ZERO)
      let borrowLimit = JSBI.divide(JSBI.multiply(price, parseInputAmount), EXA_BASE)
      let changedBorrowLimit
      if (lendMarket === LendField.SUPPLY) {
        borrowLimit = JSBI.divide(
          JSBI.multiply(JSBI.multiply(price, parseInputAmount), lendToken.getCollateralFactorMantissa()),
          LIMIT_BASE
        )
        if (tabItemActive === LendField.SUPPLY) {
          changedBorrowLimit = JSBI.add(limit, borrowLimit)
        } else {
          changedBorrowLimit = JSBI.subtract(limit, borrowLimit)
        }
      } else {
        if (tabItemActive === LendField.BORROW) {
          changedBorrowLimit = JSBI.add(borrowTotalBalance, borrowLimit)
        } else {
          changedBorrowLimit = JSBI.subtract(borrowTotalBalance, borrowLimit)
        }
      }
      return formatData(changedBorrowLimit)
    }
    return ZERO_FRACTION
  }, [lendToken, lendInputValue, inputAmount, lendMarket, tabItemActive, limit, borrowTotalBalance])

  const changedBorrowLimitUsed = useMemo(() => {
    if (lendToken && lendInputValue) {
      let changedBorrowLimitUsed
      const fraOne = new Fraction(EXA_BASE, ONE)
      if (lendMarket === LendField.SUPPLY) {
        if (JSBI.equal(borrowTotalBalance, ZERO)) {
          changedBorrowLimitUsed = new Fraction(ZERO, ONE)
        } else {
          changedBorrowLimitUsed = fraOne
            .divide(changedBorrowLimit.multiply(JSBI.divide(LIMIT_BASE, borrowTotalBalance)))
            .multiply('100')
        }
      } else {
        if (JSBI.equal(limit, ZERO)) {
          changedBorrowLimitUsed = new Fraction(ZERO, ONE)
        } else {
          changedBorrowLimitUsed = changedBorrowLimit
            .multiply(EXA_BASE)
            .divide(limit)
            .multiply('100')
        }
      }
      return changedBorrowLimitUsed.greaterThan('100')
        ? new Fraction('100', '1')
        : changedBorrowLimitUsed.lessThan('0')
        ? ZERO_FRACTION
        : changedBorrowLimitUsed
    }
    return ZERO_FRACTION
  }, [borrowTotalBalance, changedBorrowLimit, lendInputValue, lendMarket, lendToken, limit])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
  }, [])

  useEffect(() => {
    if (showLendConfirmation) {
      lendMarket === LendField.SUPPLY ? setTabItemActive(LendField.SUPPLY) : setTabItemActive(LendField.BORROW)
    } else {
      setLendInputValue('')
    }
  }, [lendMarket, showLendConfirmation])

  function onSupplyMax(): CurrencyAmount | undefined {
    return cTokenMaxAmountSpend(walletBalanceAmount)
  }

  function onWithdrawMax(lendToken: CToken | undefined, safe = true): CurrencyAmount | undefined {
    if (lendToken) {
      const collateralFactorMantissa = lendToken.getCollateralFactorMantissa()
      if (JSBI.equal(collateralFactorMantissa, ZERO)) {
        return new TokenAmount(lendToken, ZERO)
      } else {
        if (!lendToken.canBeCollateral) {
          const amount = lendToken.getSupplyBalanceAmount()
          return new TokenAmount(lendToken, amount)
        } else {
          const health = new Fraction(limit, borrowTotalBalance)
          const isHealth: boolean = health.greaterThan(ONE) || health.equalTo(ONE)
          if (!isHealth) {
            return new TokenAmount(lendToken, ZERO)
          } else {
            const price = lendToken.getUnderlyingPrice()
            const suppliedValue = lendToken.getSuppliedValue()
            const otherSuppliedTotalValue: JSBI = JSBI.subtract(limit, suppliedValue)
            const remainValue: JSBI = JSBI.subtract(
              // divide 8/10
              JSBI.divide(JSBI.multiply(borrowTotalBalance, TEN), safe ? EIGHT : TEN),
              otherSuppliedTotalValue
            )
            const owedValue = JSBI.greaterThan(remainValue, ZERO) ? remainValue : ZERO
            if (JSBI.greaterThan(remainValue, ZERO)) {
              const safeValue = JSBI.subtract(
                lendToken.getSupplyBalanceJSBI(),
                JSBI.divide(JSBI.multiply(owedValue, EXA_BASE), collateralFactorMantissa)
              )
              const amount = JSBI.divide(JSBI.multiply(safeValue, EXA_BASE), price)
              return new TokenAmount(lendToken, amount)
            } else {
              const amount = lendToken.getSupplyBalanceAmount()
              return new TokenAmount(lendToken, amount)
            }
          }
        }
      }
    }
    return undefined
  }

  function onBorrowMax(lendToken: CToken | undefined, safe = true): CurrencyAmount | undefined {
    if (lendToken) {
      const price = lendToken.getUnderlyingPrice()
      const borrowMaxValue = JSBI.subtract(
        // multiply 0.8
        JSBI.divide(JSBI.multiply(limit, safe ? EIGHT : TEN), TEN),
        borrowTotalBalance
      )
      const numerator = JSBI.greaterThan(borrowMaxValue, ZERO) ? borrowMaxValue : ZERO
      const liquidity = lendToken.getLiquidity()
      const borrowMaxAmount = JSBI.divide(JSBI.multiply(numerator, EXA_BASE), price)

      if (JSBI.greaterThan(borrowMaxAmount, liquidity)) {
        return new TokenAmount(lendToken, liquidity)
      } else {
        return new TokenAmount(lendToken, borrowMaxAmount)
      }
    }
    return undefined
  }

  function onRepayMax(lendToken: CToken | undefined): CurrencyAmount | undefined {
    if (lendToken && walletBalanceAmount) {
      const borrowAmount = new TokenAmount(lendToken, lendToken.getBorrowBalanceAmount())
      if (JSBI.greaterThan(walletBalanceAmount.raw, borrowAmount.raw)) {
        return borrowAmount
      } else {
        return walletBalanceAmount
      }
    }
    return undefined
  }

  const { inputError, inputText } = useLendingInfo(
    lendInputValue,
    lendToken,
    tabItemActive,
    limit,
    onWithdrawMax(lendToken, false),
    onBorrowMax(lendToken, false),
    walletBalanceAmount
  )

  async function onMint(cToken: CToken, lendInputValue: string, isETH: boolean) {
    const inputAmount = tryParseAmount(lendInputValue, cToken)
    const amount = inputAmount?.raw.toString()
    if (!chainId || !library || !account || !amount) return
    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (isETH) {
      const cTokenContract = getCEtherContract(chainId, cToken.cAddress, library, account)
      estimate = cTokenContract.estimateGas.mint
      method = cTokenContract.mint
      args = []
      value = BigNumber.from(amount)
    } else {
      const cTokenContract = getCERC20Contract(chainId, cToken.cAddress, library, account)
      estimate = cTokenContract.estimateGas.mint
      method = cTokenContract.mint
      args = [amount]
      value = null
    }

    setPendingText('Supply ' + lendInputValue + ' ' + cToken.symbol)
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Supply ' + lendInputValue + ' ' + cToken.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
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

  async function onRedeem(cToken: CToken, lendInputValue: string) {
    const inputAmount = tryParseAmount(lendInputValue, cToken)
    const amount = inputAmount?.raw.toString()

    if (!chainId || !library || !account || !amount) return
    const cTokenContract = getCERC20Contract(chainId, cToken.cAddress, library, account)

    let estimate, method: (...args: any) => Promise<TransactionResponse>, args: Array<string | string[] | number>
    const value: BigNumber | null = null

    const supplyBalanceAmount = new TokenAmount(cToken, cToken.getSupplyBalanceAmount()).toExact() ?? ''
    if (lendInputValue === supplyBalanceAmount) {
      estimate = cTokenContract.estimateGas.redeem
      method = cTokenContract.redeem
      args = [JSBI.BigInt(cToken.supplyBalance ?? 0).toString()]
    } else {
      estimate = cTokenContract.estimateGas.redeemUnderlying
      method = cTokenContract.redeemUnderlying
      args = [amount]
    }

    setPendingText('Withdraw ' + lendInputValue + ' ' + cToken.symbol)
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Withdraw ' + lendInputValue + ' ' + cToken.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Remove',
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

  async function onBorrow(cToken: CToken, lendInputValue: string) {
    const inputAmount = tryParseAmount(lendInputValue, cToken)
    const amount = inputAmount?.raw.toString()
    if (!chainId || !library || !account || !amount) return
    const cTokenContract = getCERC20Contract(chainId, cToken.cAddress, library, account)

    const estimate = cTokenContract.estimateGas.borrow
    const method: (...args: any) => Promise<TransactionResponse> = cTokenContract.borrow
    const args: Array<string | string[] | number> = [amount]
    const value: BigNumber | null = null

    setPendingText('Borrow ' + lendInputValue + ' ' + cToken.symbol)
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Borrow ' + lendInputValue + ' ' + cToken.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Lend',
            action: 'Borrow',
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

  async function onRepayBorrow(cToken: CToken, lendInputValue: string, isETH: boolean) {
    const inputAmount = tryParseAmount(lendInputValue, cToken)
    const amount = inputAmount?.raw.toString()
    if (!chainId || !library || !account || !amount) return

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null

    const borrowBlanceAmount = cToken.getBorrowBalanceAmount()
    const borrowAmount = new TokenAmount(cToken, borrowBlanceAmount).toExact() ?? ''
    if (isETH) {
      const maximillionContract = getMaximillionContract(chainId, library, account)
      estimate = maximillionContract.estimateGas.repayBehalf
      method = maximillionContract.repayBehalf
      args = [account]
      if (lendInputValue === borrowAmount) {
        // pay max eth with 0.35% extra ETH
        value = BigNumber.from(
          JSBI.divide(JSBI.multiply(borrowBlanceAmount, JSBI.BigInt(10035)), JSBI.BigInt(10000)).toString()
        )
      } else {
        value = BigNumber.from(amount) // TODO: consider use cTokenMaxAmountSpend to substract tx fee
      }
    } else {
      const cTokenContract = getCERC20Contract(chainId, cToken.cAddress, library, account)
      estimate = cTokenContract.estimateGas.repayBorrow
      method = cTokenContract.repayBorrow
      if (lendInputValue === borrowAmount) {
        args = ['0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff']
      } else {
        args = [amount]
      }
      value = null
    }

    setPendingText('Repay ' + lendInputValue + ' ' + cToken.symbol)
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Repay ' + lendInputValue + ' ' + cToken.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Lend',
            action: 'Repay',
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

  const confirmationContent = useCallback(
    () =>
      txHash ? (
        <></>
      ) : (
        <TransactionErrorContent onDismiss={handleDismissConfirmation} message={'Transaction rejected.'} />
      ),
    [handleDismissConfirmation, txHash]
  )

  return (
    <div>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={confirmationContent}
        pendingText={pendingText}
      />
      <Modal isOpen={showLendConfirmation} onDismiss={() => setShowLendConfirmation(false)}>
        <ModalContentWrapper>
          <AutoColumn gap={'0'} style={{ width: '100%' }}>
            <RowBetween style={{ padding: '0 2rem 1.2rem' }}>
              <div />
              <AssetLogo>
                {lendToken?.logo1 ? (
                  <DoubleAssetLogo logo0={lendToken?.logo0} logo1={lendToken?.logo1} size={24} />
                ) : (
                  <CurrencyIcon logo0={lendToken?.logo0} style={{ marginRight: '10px' }} />
                )}
                <Text fontWeight={500} fontSize={'1.1rem'}>
                  {lendToken?.symbol}
                </Text>
              </AssetLogo>
              <StyledCloseIcon onClick={() => setShowLendConfirmation(false)} />
            </RowBetween>
            <Break />
            <AutoColumn gap={'sm'}>
              {tabItemActive === LendField.WITHDRAW ||
              tabItemActive === LendField.BORROW ||
              (approvalTokenStatus === ApprovalState.APPROVED && lendToken?.address) ? (
                <ApproveWrap>
                  <div />
                  <LendInputPanel
                    value={lendInputValue}
                    safeMax={tabItemActive === LendField.WITHDRAW || tabItemActive === LendField.BORROW}
                    onUserInput={setLendInputValue}
                    onMax={() => {
                      if (lendToken) {
                        switch (tabItemActive) {
                          case LendField.SUPPLY:
                            setLendInputValue(onSupplyMax()?.toExact() ?? '')
                            break
                          case LendField.WITHDRAW:
                            setLendInputValue(onWithdrawMax(lendToken, true)?.toExact() ?? '')
                            break
                          case LendField.BORROW:
                            setLendInputValue(onBorrowMax(lendToken, true)?.toExact() ?? '')
                            break
                          case LendField.REPAY:
                            setLendInputValue(onRepayMax(lendToken)?.toExact() ?? '')
                            break
                          default:
                            break
                        }
                      } else {
                        return
                      }
                    }}
                    label={t('amount')}
                    showMaxButton={true}
                    id="lend-input"
                  />
                </ApproveWrap>
              ) : (
                <ApproveWrap>
                  {lendToken?.logo1 ? (
                    <DoubleAssetLogo logo0={lendToken?.logo0} logo1={lendToken?.logo1} size={24} />
                  ) : (
                    <CurrencyIcon logo0={lendToken?.logo0} size={'4.4rem'} style={{ marginBottom: '2rem' }} />
                  )}
                  <Text fontWeight={400} fontSize={'0.9rem'} textAlign={'center'} lineHeight={'1rem'}>
                    {t('approveQuestionHelper')}
                  </Text>
                </ApproveWrap>
              )}
            </AutoColumn>
            <AutoColumn gap={'0'}>
              <TabWrap>
                <TabItem
                  isActive={
                    lendMarket === LendField.SUPPLY
                      ? LendField.SUPPLY === tabItemActive
                      : LendField.BORROW === tabItemActive
                  }
                  onClick={() => {
                    if (
                      lendMarket === LendField.SUPPLY
                        ? LendField.SUPPLY === tabItemActive
                        : LendField.BORROW === tabItemActive
                    ) {
                      setTabItemActive(lendMarket === LendField.SUPPLY ? LendField.SUPPLY : LendField.BORROW)
                    } else {
                      setTabItemActive(lendMarket === LendField.SUPPLY ? LendField.SUPPLY : LendField.BORROW)
                      setLendInputValue('')
                    }
                  }}
                >
                  {lendMarket === LendField.SUPPLY
                    ? t(LendField.SUPPLY.toLowerCase())
                    : t(LendField.BORROW.toLowerCase())}
                </TabItem>
                <TabItem
                  isActive={
                    lendMarket === LendField.SUPPLY
                      ? LendField.WITHDRAW === tabItemActive
                      : LendField.REPAY === tabItemActive
                  }
                  onClick={() => {
                    if (
                      lendMarket === LendField.SUPPLY
                        ? LendField.WITHDRAW === tabItemActive
                        : LendField.REPAY === tabItemActive
                    ) {
                      setTabItemActive(lendMarket === LendField.SUPPLY ? LendField.WITHDRAW : LendField.REPAY)
                    } else {
                      setTabItemActive(lendMarket === LendField.SUPPLY ? LendField.WITHDRAW : LendField.REPAY)
                      setLendInputValue('')
                    }
                  }}
                >
                  {lendMarket === LendField.SUPPLY
                    ? t(LendField.WITHDRAW.toLowerCase())
                    : t(LendField.REPAY.toLowerCase())}
                </TabItem>
              </TabWrap>
              <Break />
            </AutoColumn>
            <AutoColumn gap={'0'}>
              <RateWrap>
                <RateTitle>{lendMarket === LendField.BORROW ? t('borrowRates') : t('supplyRates')}</RateTitle>
                <RatePanel>
                  <AutoRow>
                    {lendToken?.logo1 ? (
                      <DoubleAssetLogo logo0={lendToken?.logo0} logo1={lendToken?.logo1} size={24} />
                    ) : (
                      <CurrencyIcon logo0={lendToken?.logo0} style={{ marginRight: '6px' }} />
                    )}
                    <Text lineHeight={'24px'}>
                      {lendToken?.symbol} {t('APY')}
                    </Text>
                  </AutoRow>
                  <RateCalculation>
                    {lendMarket === LendField.SUPPLY
                      ? getSupplyApy(lendToken).toFixed(2)
                      : getBorrowApy(lendToken).toFixed(2)}
                    %
                  </RateCalculation>
                </RatePanel>
              </RateWrap>
              {(lendToken?.canBeCollateral ||
                tabItemActive === LendField.WITHDRAW ||
                tabItemActive === LendField.BORROW) && (
                <RateWrap>
                  <RateTitle>{t('borrowLimit')}</RateTitle>
                  <RatePanel>
                    <Text lineHeight={'24px'}>
                      {lendMarket === LendField.BORROW ? t('borrowBalance') : t('borrowLimit')}
                    </Text>
                    <RateCalculation>
                      <Text>
                        $
                        {lendMarket === LendField.BORROW
                          ? formatData(borrowTotalBalance)?.toFixed(2)
                          : formatData(limit).toFixed(2)}
                      </Text>
                      {lendInputValue && (
                        <>
                          <ArrowRight color={'#ff007a'} size={16} />
                          <Text>${changedBorrowLimit.toFixed(2)}</Text>
                        </>
                      )}
                    </RateCalculation>
                  </RatePanel>
                  <Break />
                  <RatePanel>
                    <AutoRow>
                      <Text lineHeight={'24px'}>{t('borrowLimitUsed')}</Text>
                    </AutoRow>
                    <RateCalculation>
                      <Text>{usedLimit.toSignificant(4) ?? '0.00'}%</Text>
                      {lendInputValue && (
                        <>
                          <ArrowRight color={'#ff007a'} size={16} />
                          <Text>{changedBorrowLimitUsed.toFixed(2)}%</Text>
                        </>
                      )}
                    </RateCalculation>
                  </RatePanel>
                  <MarketBar
                    rate={
                      lendInputValue && changedBorrowLimitUsed
                        ? Number(changedBorrowLimitUsed.toFixed(2))
                        : Number(usedLimit.toSignificant(4))
                    }
                  />
                </RateWrap>
              )}
            </AutoColumn>
            <AutoColumn gap="md" style={{ padding: '1.4rem 2rem 0' }}>
              {tabItemActive === LendField.SUPPLY || tabItemActive === LendField.REPAY ? (
                <>
                  {approvalTokenStatus === ApprovalState.APPROVED ? (
                    <ButtonLight
                      disabled={inputError}
                      onClick={() => {
                        setTxHash('')
                        setShowConfirm(true)
                        if (lendToken && inputAmount && tabItemActive === LendField.SUPPLY) {
                          onMint(lendToken, lendInputValue, lendToken.isETH())
                          setShowLendConfirmation(false)
                        }
                        if (lendToken && inputAmount && tabItemActive === LendField.REPAY) {
                          onRepayBorrow(lendToken, lendInputValue, lendToken.isETH())
                          setShowLendConfirmation(false)
                        }
                      }}
                    >
                      {inputText?.toLocaleUpperCase()}
                    </ButtonLight>
                  ) : (
                    <ButtonLight
                      disabled={approvalTokenStatus === ApprovalState.PENDING}
                      onClick={() => {
                        setTxHash('')
                        setPendingText('')
                        setShowConfirm(true)
                        approveCallback()
                      }}
                    >
                      {approvalTokenStatus === ApprovalState.PENDING ? <Dots>{t('approvePending')}</Dots> : t('enable')}
                    </ButtonLight>
                  )}
                </>
              ) : (
                <ButtonLight
                  disabled={inputError}
                  onClick={() => {
                    setTxHash('')
                    setShowConfirm(true)
                    if (lendToken && inputAmount && tabItemActive === LendField.WITHDRAW) {
                      onRedeem(lendToken, lendInputValue)
                      setShowLendConfirmation(false)
                    }

                    if (lendToken && inputAmount && tabItemActive === LendField.BORROW) {
                      onBorrow(lendToken, lendInputValue)
                      setShowLendConfirmation(false)
                    }
                  }}
                >
                  {inputText?.toLocaleUpperCase()}
                </ButtonLight>
              )}
            </AutoColumn>
            <AutoColumn gap={'0'} style={{ padding: '0.6rem 2rem 0' }}>
              <AutoRow justify={'space-between'}>
                <Text fontWeight={500}>
                  {tabItemActive === LendField.WITHDRAW || tabItemActive === LendField.BORROW
                    ? tabItemActive === LendField.WITHDRAW
                      ? t('currentlySupplying')
                      : t('currentlyBorrowing')
                    : t('walletBalance')}
                </Text>
                {(lendToken && tabItemActive === LendField.WITHDRAW) ||
                (lendToken && tabItemActive === LendField.BORROW)
                  ? Number(
                      parseFloat(
                        tabItemActive === LendField.WITHDRAW
                          ? new TokenAmount(lendToken, lendToken.getSupplyBalanceAmount()).toSignificant()
                          : new TokenAmount(lendToken, lendToken.getBorrowBalanceAmount()).toSignificant()
                      ).toFixed(4)
                    ) || '0'
                  : walletBalanceAmount?.toSignificant() || '0'}
                {' ' + lendToken?.symbol}
              </AutoRow>
            </AutoColumn>
          </AutoColumn>
        </ModalContentWrapper>
      </Modal>
    </div>
  )
}

export default LendModal
