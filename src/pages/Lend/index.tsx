import React, { useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import ReactGA from 'react-ga'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'

import Summary from '../../components/Summary'
import SupplyMarkets from '../../components/SupplyMarkets'
import BorrowMarkets from '../../components/BorrowMarkets'
import { CToken, CTokenState, useCTokens } from '../../data/CToken'
import { useActiveWeb3React } from '../../hooks'
import { calculateGasMargin, getComptrollerContract, getCERC20Contract, getCEtherContract } from '../../utils'
import { useApproveCallback } from '../../hooks/useApproveCallback'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { CurrencyAmount, JSBI, Fraction } from '@uniswap/sdk'
// import { utils } from 'ethers'
import { useAllLendBalances } from '../../state/wallet/hooks'
// import { RowBetween } from '../../components/Row'
// import Loader from '../../components/Loader'

export const ethMantissa = 1e18
export const blocksPerDay = 4 * 60 * 24
export const daysPerYear = 365

export enum LendField {
  SUPPLY = 'SUPPLY',
  BORROW = 'BORROW',
  WITHDRAW = 'WITHDRAW',
  REPAY = 'REPAY'
}

export const ONE = JSBI.BigInt(1)
// export const EXA_BASE = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const EXCHANGE_RATE_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const COLLATERAL_FACTOR_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const LIQUIDITY = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))

export function balanceFormat(digits: number): JSBI {
  return JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(digits))
}

export function underlyingPriceFormat(digits: number): JSBI {
  return JSBI.exponentiate(
    JSBI.BigInt(10),
    JSBI.add(JSBI.subtract(JSBI.BigInt(18), JSBI.BigInt(digits)), JSBI.BigInt(18))
  )
}

export function getSuppliedValue(ctoken: CToken) {
  return parseFloat(
    ctoken?.exchangeRateMantissa &&
      ctoken?.supplyBalance &&
      ctoken?.decimals &&
      ctoken?.underlyingPrice &&
      ctoken?.collateralFactorMantissa
      ? new Fraction(
          JSBI.multiply(
            JSBI.multiply(JSBI.BigInt(ctoken.supplyBalance ?? 0), JSBI.BigInt(ctoken.exchangeRateMantissa ?? 0)),
            JSBI.multiply(JSBI.BigInt(ctoken.underlyingPrice ?? 0), JSBI.BigInt(ctoken.collateralFactorMantissa ?? 0))
          ),
          JSBI.multiply(
            JSBI.multiply(balanceFormat(ctoken?.decimals), EXCHANGE_RATE_MANTISSA),
            JSBI.multiply(underlyingPriceFormat(ctoken?.decimals), COLLATERAL_FACTOR_MANTISSA)
          )
        ).toSignificant(18)
      : JSBI.BigInt('0').toString()
  )
}

export function getSupplyTotalBalance(allMarketsAsset: CToken[]) {
  let supplyTotalBalance = 0
  for (let i = 0; i < allMarketsAsset.length; i++) {
    supplyTotalBalance += parseFloat(
      allMarketsAsset[i]?.exchangeRateMantissa &&
        allMarketsAsset[i]?.supplyBalance &&
        allMarketsAsset[i]?.decimals &&
        allMarketsAsset[i]?.underlyingPrice
        ? new Fraction(
            JSBI.multiply(
              JSBI.multiply(
                JSBI.BigInt(allMarketsAsset[i].supplyBalance ?? 0),
                JSBI.BigInt(allMarketsAsset[i].exchangeRateMantissa ?? 0)
              ),
              JSBI.BigInt(allMarketsAsset[i]?.underlyingPrice ?? 0)
            ),
            JSBI.multiply(
              JSBI.multiply(balanceFormat(allMarketsAsset[i]?.decimals), EXCHANGE_RATE_MANTISSA),
              underlyingPriceFormat(allMarketsAsset[i]?.decimals)
            )
          ).toSignificant(18)
        : JSBI.BigInt('0').toString()
    )
  }
  return supplyTotalBalance
}

export function getBorrowTotalBalance(allMarketsAsset: CToken[]) {
  let borrowTotalBalance = 0
  for (let i = 0; i < allMarketsAsset.length; i++) {
    borrowTotalBalance += parseFloat(
      allMarketsAsset[i]?.borrowBalance && allMarketsAsset[i]?.decimals && allMarketsAsset[i]?.underlyingPrice
        ? new Fraction(
            JSBI.multiply(
              JSBI.BigInt(allMarketsAsset[i].borrowBalance ?? 0),
              JSBI.BigInt(allMarketsAsset[i]?.underlyingPrice ?? 0)
            ),
            JSBI.multiply(
              balanceFormat(allMarketsAsset[i]?.decimals),
              underlyingPriceFormat(allMarketsAsset[i]?.decimals)
            )
          ).toSignificant(18)
        : JSBI.BigInt('0').toString()
    )
  }
  return borrowTotalBalance
}

export function getSupplyBalanceAmount(ctoken: CToken) {
  return ctoken?.exchangeRateMantissa && ctoken?.supplyBalance && ctoken?.decimals
    ? new Fraction(
        JSBI.multiply(JSBI.BigInt(ctoken.supplyBalance ?? 0), JSBI.BigInt(ctoken.exchangeRateMantissa ?? 0)),
        JSBI.multiply(balanceFormat(ctoken?.decimals), COLLATERAL_FACTOR_MANTISSA)
      ).toSignificant(18)
    : JSBI.BigInt('0').toString()
}

export function getBorrowBalanceAmount(ctoken: CToken) {
  return ctoken?.exchangeRateMantissa && ctoken?.supplyBalance && ctoken?.decimals
    ? new Fraction(JSBI.BigInt(ctoken.borrowBalance ?? 0), balanceFormat(ctoken?.decimals)).toSignificant(18)
    : JSBI.BigInt('0').toString()
}

export function getSupplyApy(ctoken: CToken) {
  return (Math.pow(((ctoken?.supplyRatePerBlock ?? 0) / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1) * 100
}

export function getBorrowApy(ctoken: CToken) {
  return (Math.pow(((ctoken?.borrowRatePerBlock ?? 0) / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1) * 100
}

export function getSupplyBalance(ctoken: CToken) {
  return parseFloat(
    ctoken?.exchangeRateMantissa && ctoken?.supplyBalance && ctoken?.decimals && ctoken?.underlyingPrice
      ? new Fraction(
          JSBI.multiply(
            JSBI.multiply(JSBI.BigInt(ctoken.supplyBalance ?? 0), JSBI.BigInt(ctoken.exchangeRateMantissa ?? 0)),
            JSBI.BigInt(ctoken?.underlyingPrice ?? 0)
          ),
          JSBI.multiply(
            JSBI.multiply(balanceFormat(ctoken?.decimals), EXCHANGE_RATE_MANTISSA),
            underlyingPriceFormat(ctoken?.decimals)
          )
        ).toSignificant(18)
      : JSBI.BigInt('0').toString()
  )
}

export function getLimit(allMarketsAsset: CToken[]) {
  let borrowLimit = 0
  for (let i = 0; i < allMarketsAsset.length; i++) {
    borrowLimit +=
      allMarketsAsset[i]?.exchangeRateMantissa &&
      allMarketsAsset[i]?.supplyBalance &&
      allMarketsAsset[i]?.decimals &&
      allMarketsAsset[i]?.underlyingPrice &&
      allMarketsAsset[1]?.collateralFactorMantissa
        ? parseFloat(
            new Fraction(
              JSBI.multiply(
                JSBI.multiply(
                  JSBI.BigInt(allMarketsAsset[i].supplyBalance ?? 0),
                  JSBI.BigInt(allMarketsAsset[i].exchangeRateMantissa ?? 0)
                ),
                JSBI.multiply(
                  JSBI.BigInt(allMarketsAsset[i].underlyingPrice ?? 0),
                  JSBI.BigInt(allMarketsAsset[i].collateralFactorMantissa ?? 0)
                )
              ),
              JSBI.multiply(
                JSBI.multiply(balanceFormat(allMarketsAsset[i]?.decimals), EXCHANGE_RATE_MANTISSA),
                JSBI.multiply(underlyingPriceFormat(allMarketsAsset[i]?.decimals), COLLATERAL_FACTOR_MANTISSA)
              )
            ).toSignificant(18)
          )
        : 0
  }
  return borrowLimit
}

export function getLiquidity(ctoken: CToken) {
  return ctoken?.liquidity && ctoken?.decimals && ctoken?.underlyingPrice
    ? parseFloat(
        new Fraction(
          JSBI.multiply(JSBI.BigInt(ctoken.liquidity), JSBI.BigInt(ctoken.underlyingPrice)),
          JSBI.multiply(LIQUIDITY, underlyingPriceFormat(ctoken.decimals))
        ).toSignificant(18)
      ) / 1000
    : 0
  // ? (parseFloat(utils.formatEther(item?.liquidity)) * parseFloat(utils.formatEther(item?.underlyingPrice))) / 1000 <
  //   100
  //   ? (
  //       (parseFloat(utils.formatEther(item?.liquidity)) * parseFloat(utils.formatEther(item?.underlyingPrice))) /
  //       1000
  //     ).toFixed(1)
  //   : '< 0.1'
  // : ''
}

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

// const TopSection = styled(AutoColumn)`
//   max-width: 1200px;
//   width: 100%;
//   background-color: ${({ theme }) => theme.bg1};
// `

export default function Lend() {
  // const DataRow = styled(RowBetween)`
  //   ${({ theme }) => theme.mediaWidth.upToSmall`
  //   flex-direction: column;
  // `};
  // `

  const { account, chainId, library } = useActiveWeb3React()

  // modal and loading
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  // check whether the user has approved the router on the tokens
  const [approvalCToken, approveCTokenCallback] = useApproveCallback(
    CurrencyAmount.ether(BigInt(1)),
    '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e'
  )

  const addTransaction = useTransactionAdder()

  const tokenBalances = useAllLendBalances()

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

  async function onMint(cToken: CToken, amount: string, isETH: boolean) {
    if (!chainId || !library || !account) return

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

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Add ' + amount + ' ' + cToken.symbol
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

  async function onRedeemUnderlying(cToken: CToken, amount: string) {
    if (!chainId || !library || !account) return
    const cTokenContract = getCERC20Contract(chainId, cToken.cAddress, library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    estimate = cTokenContract.estimateGas.redeemUnderlying
    method = cTokenContract.redeemUnderlying
    args = [amount]
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
            summary: 'Redeem ' + amount + ' ' + cToken.symbol
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

  async function onBorrow(cToken: CToken, amount: string) {
    if (!chainId || !library || !account) return
    const cTokenContract = getCERC20Contract(chainId, cToken.cAddress, library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    estimate = cTokenContract.estimateGas.borrow
    method = cTokenContract.borrow
    args = [amount]
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
            summary: 'Borrow ' + amount + ' ' + cToken.symbol
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

  async function onRepayBorrow(cToken: CToken, amount: string, isETH: boolean) {
    if (!chainId || !library || !account) return

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

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Repay ' + amount + ' ' + cToken.symbol
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

  const allMarkets = useCTokens()

  const allMarketsAsset: CToken[] = allMarkets.map((item: any) => {
    return {
      ...item?.[1]
    }
  })

  function getBorrowBalance(ctoken: CToken) {
    return parseFloat(
      ctoken?.borrowBalance && ctoken?.decimals && ctoken?.underlyingPrice
        ? new Fraction(
            JSBI.multiply(JSBI.BigInt(ctoken.borrowBalance ?? 0), JSBI.BigInt(ctoken?.underlyingPrice ?? 0)),
            JSBI.multiply(balanceFormat(ctoken?.decimals), underlyingPriceFormat(ctoken?.decimals))
          ).toSignificant(18)
        : JSBI.BigInt('0').toString()
    )
  }

  function sumUnderlyingAssets() {
    let sumUnderlyingAssets = 0
    for (let i = 0; i < allMarketsAsset.length; i++) {
      sumUnderlyingAssets += allMarketsAsset[i]
        ? getSupplyBalance(allMarketsAsset[i]) * getSupplyApy(allMarketsAsset[i]) -
          getBorrowBalance(allMarketsAsset[i]) * getBorrowApy(allMarketsAsset[i])
        : 0
    }
    return sumUnderlyingAssets
  }

  function getNetApy() {
    let allBorrowUnderlyingAssets = 0
    for (let i = 0; i < allMarketsAsset.length; i++) {
      allBorrowUnderlyingAssets += parseFloat(
        allMarketsAsset[i]?.borrowBalance && allMarketsAsset[i]?.decimals && allMarketsAsset[i]?.underlyingPrice
          ? new Fraction(
              JSBI.multiply(
                JSBI.BigInt(allMarketsAsset[i].borrowBalance ?? 0),
                JSBI.BigInt(allMarketsAsset[i]?.underlyingPrice ?? 0)
              ),
              JSBI.multiply(
                balanceFormat(allMarketsAsset[i]?.decimals),
                underlyingPriceFormat(allMarketsAsset[i]?.decimals)
              )
            ).toSignificant(18)
          : JSBI.BigInt('0').toString()
      )
    }

    const sumAssets = sumUnderlyingAssets()
    const supplyTotalBalance = getSupplyTotalBalance(allMarketsAsset)
    if (sumAssets && sumAssets > 0 && supplyTotalBalance) {
      return sumAssets / supplyTotalBalance
    } else if (allBorrowUnderlyingAssets && sumAssets && sumAssets < 0) {
      return sumAssets / allBorrowUnderlyingAssets
    } else {
      return 0
    }
  }

  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <Summary
          allMarkets={allMarkets}
          supplyTotalBalance={getSupplyTotalBalance(allMarketsAsset)}
          borrowTotalBalance={getBorrowTotalBalance(allMarketsAsset)}
          limit={getLimit(allMarketsAsset)}
          netApy={getNetApy()}
        ></Summary>
        <MarketsWrap>
          <SupplyMarkets
            allMarkets={allMarkets}
            tokenBalances={tokenBalances}
            onEnterMarkets={onEnterMarkets}
            onExitMarkets={onExitMarkets}
            onMint={onMint}
            onRedeemUnderlying={onRedeemUnderlying}
            borrowTotalBalance={getBorrowTotalBalance(allMarketsAsset)}
            limit={getLimit(allMarketsAsset)}
          ></SupplyMarkets>
          <BorrowMarkets
            allMarkets={allMarkets}
            tokenBalances={tokenBalances}
            limit={getLimit(allMarketsAsset)}
            onBorrow={onBorrow}
            onRepayBorrow={onRepayBorrow}
          ></BorrowMarkets>
        </MarketsWrap>
      </PageWrapper>
    </>
  )
}
