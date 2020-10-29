import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import { Text } from 'rebass'
import { AutoRow, RowBetween } from '../Row'
import { AlertTriangle, ArrowRight, X } from 'react-feather'
import { CToken } from '../../data/CToken'
import { ButtonLight } from '../Button'
import CurrencyIcon from '../CurrencyIcon'
import LendInputPanel from '../LendInputPanel'

import { ApprovalState, useCTokenApproveCallback } from '../../hooks/useApproveCallback'
import {
  BLOCKS_PER_DAY,
  calculateGasMargin,
  DAYS_PER_YEAR,
  ETH_MANTISSA,
  formatData,
  EXA_BASE,
  getCERC20Contract,
  getCEtherContract,
  withLimit,
  transferCurrencyAmount,
  LIMIT_BASE
} from '../../utils'
import { useActiveWeb3React } from '../../hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import ReactGA from 'react-ga'
import { LendField } from '../../state/lending/actions'
import MarketBar from '../MarketBar'
import { useAllCTokenBalances, useCTokenBalance } from '../../state/wallet/hooks'
import { tryParseAmount } from '../../state/swap/hooks'
import { cTokenMaxAmountSpend } from '../../utils/maxAmountSpend'
import { Fraction, JSBI, Rounding, TokenAmount } from '@uniswap/sdk'
import { useLendingInfo } from '../../state/lending/hooks'
import DoubleAssetLogo from '../DoubleAssetLogo'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../TransactionConfirmationModal'

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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.75rem;
`

const TabWrap = styled.div`
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
  color: ${({ isActive }) => (isActive ? '#ff007a' : '#AAB8C1')};
  padding-bottom: 0.8rem;
  font-weight: 600;
  :after {
    background: ${({ isActive }) => (isActive ? '#ff007a' : 'none')};
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
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 0;
`

const RateCalculation = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #141e27;
`

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

export interface LendModalProps {
  lendToken: CToken | undefined
  showLendConfirmation: boolean
  setShowLendConfirmation: Function
  borrowTotalBalance: JSBI
  limit: JSBI
  usedLimit: Fraction
  lendMarket?: LendField
}

function LendModal({
  lendToken,
  showLendConfirmation,
  setShowLendConfirmation,
  borrowTotalBalance,
  limit,
  usedLimit,
  lendMarket
}: LendModalProps) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  const { account, chainId, library } = useActiveWeb3React()

  // modal and confirm
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  console.log('use txHash and attemptingTxn later like Add Liquidity', attemptingTxn, txHash)

  const lendTokenBalance = useCTokenBalance(lendToken)

  const maxSupplyAmount = cTokenMaxAmountSpend(lendTokenBalance)

  const addTransaction = useTransactionAdder()

  const [tabItemActive, setTabItemActive] = useState<LendField>()

  const [lendInputValue, setLendInputValue] = useState('')

  const [pendingText, setPendingText] = useState('')

  const [approvalTokenStatus, approveCallback] = useCTokenApproveCallback(lendToken, lendToken?.cAddress)

  const inputAmount = useMemo(() => tryParseAmount(lendInputValue, lendToken), [lendToken, lendInputValue])

  const walletBalanceAmount = useAllCTokenBalances([lendToken])

  const changedBorrowLimit = useMemo(() => {
    if (lendToken && lendInputValue) {
      const price = lendToken.getUnderlyingPrice()
      const parseInputAmount = transferCurrencyAmount(inputAmount)
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
        changedBorrowLimitUsed = fraOne
          .divide(changedBorrowLimit.multiply(JSBI.divide(LIMIT_BASE, borrowTotalBalance)))
          .multiply('100')
      } else {
        changedBorrowLimitUsed = changedBorrowLimit
          .multiply(EXA_BASE)
          .divide(limit)
          .multiply('100')
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
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      setLendInputValue('')
    }
    setTxHash('')
  }, [setLendInputValue, txHash])

  useEffect(() => {
    if (showLendConfirmation) {
      lendMarket === LendField.SUPPLY ? setTabItemActive(LendField.SUPPLY) : setTabItemActive(LendField.BORROW)
    } else {
      setLendInputValue('')
    }
  }, [lendMarket, showLendConfirmation])

  function onWithdrawMax(lendToken: CToken | undefined, safe = true): Fraction {
    if (lendToken) {
      const collateralFactorMantissa = lendToken.getCollateralFactorMantissa()
      if (JSBI.equal(collateralFactorMantissa, ZERO)) {
        return ZERO_FRACTION
      } else {
        const supplyBalance = lendToken.getSupplyBalanceJSBI()
        if (!lendToken.canBeCollateral) {
          return new Fraction(lendToken.getSupplyBalanceAmount(), EXA_BASE)
        } else {
          const price = lendToken.getUnderlyingPrice()
          const suppliedValue = withLimit(lendToken, lendToken.getSupplyBalanceJSBI())
          const otherSuppliedTotalValue: JSBI = JSBI.subtract(limit, suppliedValue)
          const remainValue: JSBI = JSBI.subtract(
            // divide 8/10
            JSBI.divide(JSBI.multiply(borrowTotalBalance, TEN), safe ? EIGHT : TEN),
            otherSuppliedTotalValue
          )
          const owedValue = JSBI.greaterThan(remainValue, ZERO) ? remainValue : ZERO
          const safeValue = JSBI.subtract(
            supplyBalance,
            JSBI.divide(JSBI.multiply(owedValue, EXA_BASE), collateralFactorMantissa)
          )
          return new Fraction(safeValue, price)
        }
      }
    }
    return ZERO_FRACTION
  }

  function onBorrowMax(lendToken: CToken | undefined, safe = true): Fraction {
    if (lendToken) {
      const price = lendToken.getUnderlyingPrice()
      const borrowMaxValue = JSBI.subtract(
        // multiply 8/10
        JSBI.divide(JSBI.multiply(limit, safe ? EIGHT : TEN), TEN),
        borrowTotalBalance
      )
      const numerator = JSBI.greaterThan(borrowMaxValue, ZERO) ? borrowMaxValue : ZERO
      const liquidity = lendToken.getLiquidity()
      const borrowMaxAmount = JSBI.divide(JSBI.multiply(numerator, EXA_BASE), price)

      if (JSBI.greaterThan(borrowMaxAmount, liquidity)) {
        return new Fraction(liquidity, price)
      } else {
        return new Fraction(numerator, price)
      }
    }
    return ZERO_FRACTION
  }

  const { inputError, inputText } = useLendingInfo(
    lendInputValue,
    lendToken,
    tabItemActive,
    limit,
    onWithdrawMax(lendToken, false),
    onBorrowMax(lendToken, false)
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

  async function onRedeemUnderlying(cToken: CToken, lendInputValue: string) {
    const inputAmount = tryParseAmount(lendInputValue, cToken)
    const amount = inputAmount?.raw.toString()
    if (!chainId || !library || !account || !amount) return
    const cTokenContract = getCERC20Contract(chainId, cToken.cAddress, library, account)

    const estimate = cTokenContract.estimateGas.redeemUnderlying
    const method: (...args: any) => Promise<TransactionResponse> = cTokenContract.redeemUnderlying
    const args: Array<string | string[] | number> = [amount]
    const value: BigNumber | null = null

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
    if (isETH) {
      const cTokenContract = getCEtherContract(chainId, cToken.cAddress, library, account)
      estimate = cTokenContract.estimateGas.repayBorrow
      method = cTokenContract.repayBorrow
      args = []
      value = BigNumber.from(BigInt(1).toString())
    } else {
      const cTokenContract = getCERC20Contract(chainId, cToken.cAddress, library, account)
      estimate = cTokenContract.estimateGas.repayBorrow
      method = cTokenContract.repayBorrow
      args = [amount]
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

  const ConfirmModalTop = () => {
    const theme = useContext(ThemeContext)
    return (
      <Wrapper>
        <Section>
          <AutoColumn gap="12px" justify={'center'}>
            <AlertTriangle color={theme.red1} style={{ strokeWidth: 1.5 }} size={64} />
            <Text fontWeight={500} fontSize={16} color={theme.red1} style={{ textAlign: 'center', width: '85%' }}>
              Transaction rejected.
            </Text>
          </AutoColumn>
        </Section>
      </Wrapper>
    )
  }

  const ConfirmModalBottom = () => {
    return <ButtonLight onClick={handleDismissConfirmation}>Dismiss</ButtonLight>
  }

  function setShowDecimails(ctoken: CToken): number {
    return ctoken.decimals > 8 ? 8 : ctoken.decimals
  }

  return (
    <div>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <ConfirmationModalContent
            title={'Error'}
            onDismiss={handleDismissConfirmation}
            topContent={ConfirmModalTop}
            bottomContent={ConfirmModalBottom}
          />
        )}
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
            <AutoColumn gap={'sm'} style={{ backgroundColor: '#f9fafb' }}>
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
                      if (lendToken && walletBalanceAmount[0]) {
                        switch (tabItemActive) {
                          case LendField.SUPPLY:
                            setLendInputValue(
                              maxSupplyAmount?.toFixed(setShowDecimails(lendToken), undefined, Rounding.ROUND_DOWN) ??
                                ''
                            )
                            break
                          case LendField.WITHDRAW:
                            setLendInputValue(
                              onWithdrawMax(lendToken).toFixed(
                                setShowDecimails(lendToken),
                                undefined,
                                Rounding.ROUND_DOWN
                              )
                            )
                            break
                          case LendField.BORROW:
                            setLendInputValue(
                              onBorrowMax(lendToken).toFixed(
                                setShowDecimails(lendToken),
                                undefined,
                                Rounding.ROUND_DOWN
                              )
                            )
                            break
                          case LendField.REPAY:
                            const borrowAmount = new TokenAmount(lendToken, lendToken.getBorrowBalanceAmount())
                            setLendInputValue(
                              JSBI.greaterThan(walletBalanceAmount[0].raw, borrowAmount.raw)
                                ? borrowAmount.toFixed(setShowDecimails(lendToken), undefined, Rounding.ROUND_DOWN)
                                : walletBalanceAmount[0].toFixed(
                                    setShowDecimails(lendToken),
                                    undefined,
                                    Rounding.ROUND_DOWN
                                  )
                            )
                            break
                          default:
                            break
                        }
                      } else {
                        return
                      }
                    }}
                    label={'Amount'}
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
                  <Text fontWeight={400} fontSize={'0.9rem'} color={'#AAB8C1'} textAlign={'center'} lineHeight={'1rem'}>
                    To Supply or Repay Tether to the Compound Protocol, you need to enable it first.
                  </Text>
                </ApproveWrap>
              )}
            </AutoColumn>
            <AutoColumn gap={'0'} style={{ backgroundColor: '#f9fafb' }}>
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
                  {lendMarket === LendField.SUPPLY ? LendField.SUPPLY : LendField.BORROW}
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
                  {lendMarket === LendField.SUPPLY ? LendField.WITHDRAW : LendField.REPAY}
                </TabItem>
              </TabWrap>
              <Break />
            </AutoColumn>
            <AutoColumn gap={'0'}>
              <RateWrap>
                <RateTitle>{lendMarket === LendField.BORROW ? 'Borrow Rates' : 'Supply Rates'}</RateTitle>
                <RatePanel>
                  <AutoRow>
                    {lendToken?.logo1 ? (
                      <DoubleAssetLogo logo0={lendToken?.logo0} logo1={lendToken?.logo1} size={24} />
                    ) : (
                      <CurrencyIcon logo0={lendToken?.logo0} style={{ marginRight: '6px' }} />
                    )}
                    <Text color={'#AAB8C1;'} lineHeight={'24px'}>
                      {lendToken?.symbol} APY
                    </Text>
                  </AutoRow>
                  <RateCalculation>
                    {lendMarket === LendField.SUPPLY
                      ? (
                          (Math.pow(
                            ((lendToken?.supplyRatePerBlock ? lendToken?.supplyRatePerBlock : 0) / ETH_MANTISSA) *
                              BLOCKS_PER_DAY +
                              1,
                            DAYS_PER_YEAR - 1
                          ) -
                            1) *
                          100
                        ).toFixed(2)
                      : (
                          (Math.pow(
                            ((lendToken?.borrowRatePerBlock ? lendToken?.borrowRatePerBlock : 0) / ETH_MANTISSA) *
                              BLOCKS_PER_DAY +
                              1,
                            DAYS_PER_YEAR - 1
                          ) -
                            1) *
                          100
                        ).toFixed(2)}
                    %
                  </RateCalculation>
                </RatePanel>
              </RateWrap>
              {(lendToken?.canBeCollateral ||
                tabItemActive === LendField.WITHDRAW ||
                tabItemActive === LendField.BORROW) && (
                <RateWrap>
                  <RateTitle>Borrow Limit</RateTitle>
                  <RatePanel>
                    <Text color={'#AAB8C1'} lineHeight={'24px'}>
                      {lendMarket === LendField.BORROW ? 'Borrow Balance' : 'Borrow Limit'}
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
                      <Text color={'#AAB8C1'} lineHeight={'24px'}>
                        Borrow Limit Used
                      </Text>
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
                        setShowConfirm(true)
                        if (lendToken && inputAmount && onMint && tabItemActive === LendField.SUPPLY) {
                          onMint(lendToken, lendInputValue, lendToken.isETH())
                          setShowLendConfirmation(false)
                        }
                        if (lendToken && inputAmount && onRepayBorrow && tabItemActive === LendField.REPAY) {
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
                        setPendingText('')
                        approveCallback()
                        setShowConfirm(true)
                        setShowLendConfirmation(false)
                      }}
                    >
                      ENABLE
                    </ButtonLight>
                  )}
                </>
              ) : (
                <ButtonLight
                  disabled={inputError}
                  onClick={() => {
                    setShowConfirm(true)
                    if (lendToken && inputAmount && onRedeemUnderlying && tabItemActive === LendField.WITHDRAW) {
                      onRedeemUnderlying(lendToken, lendInputValue)
                      setShowLendConfirmation(false)
                    }

                    if (lendToken && inputAmount && onBorrow && tabItemActive === LendField.BORROW) {
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
                <Text color={'#AAB8C1'} fontWeight={500}>
                  {tabItemActive === LendField.WITHDRAW || tabItemActive === LendField.BORROW
                    ? tabItemActive === LendField.WITHDRAW
                      ? 'Currently Supplying'
                      : 'Currently Borrowing'
                    : 'Wallet Balance'}
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
                  : lendTokenBalance?.toSignificant() || '0'}
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
