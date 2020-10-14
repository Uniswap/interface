import React, { useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import ReactGA from 'react-ga'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'

import Summary from '../../components/Summary'
import SupplyMarkets from '../../components/SupplyMarkets'
import BorrowMarkets from '../../components/BorrowMarkets'
import { useCTokens } from '../../data/CToken'
import { useActiveWeb3React } from '../../hooks'
import { calculateGasMargin, getComptrollerContract, getCTokenContract } from '../../utils'
import { useApproveCallback } from '../../hooks/useApproveCallback'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { ChainId, CurrencyAmount } from '@uniswap/sdk'
import { COMPTROLLER_ADDRESSES } from '../../constants/lend'
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
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(CurrencyAmount.ether(BigInt(1)), COMPTROLLER_ADDRESSES[chainId as ChainId])

  const addTransaction = useTransactionAdder()

  async function onEnterMarkets(cTokenAddress: string) {
    if (!chainId || !library || !account) return
    // const router = getCTokenContract(chainId, '0x4a77faee9650b09849ff459ea1476eab01606c7a', library, account)
    const comptroller = getComptrollerContract(chainId, library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    estimate = comptroller.estimateGas.enterMarkets
    method = comptroller.enterMarkets
    args = [
      [cTokenAddress]
    ]
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
            summary:
              'Enter ' +
              '1' +
              ' ' +
              'cETH' +
              ' as Collateral'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Collateral',
            action: 'Enter',
            label: 'cETH'
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

  async function onExitMarkets(cTokenAddress: string) {
    if (!chainId || !library || !account) return
    const comptroller = getComptrollerContract(chainId, library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    estimate = comptroller.estimateGas.ExitMarkets
    method = comptroller.ExitMarkets
    args = [
      cTokenAddress
    ]
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
            summary:
              'Exit ' +
              '1' +
              ' ' +
              'cETH' +
              ' as Collateral'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Collateral',
            action: 'Exit',
            label: 'cETH'
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

  async function onMint(amount: number, isETH: boolean) {
    if (!chainId || !library || !account) return
    const cTokenContract = getCTokenContract(chainId, '0x4a77faee9650b09849ff459ea1476eab01606c7a', library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (isETH) {
      estimate = cTokenContract.estimateGas.mint
      method = cTokenContract.mint
      args = []
      value = BigNumber.from(BigInt(1).toString())
    } else {
      estimate = cTokenContract.estimateGas.mint
      method = cTokenContract.mint
      args = [
        BigInt(1).toString()
      ]
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
            summary:
              'Add ' +
              '1' +
              ' ' +
              'ETH'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: 'ETH'
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

  async function onRedeemUnderlying(amount: number) {
    if (!chainId || !library || !account) return
    const cTokenContract = getCTokenContract(chainId, '0x4a77faee9650b09849ff459ea1476eab01606c7a', library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    estimate = cTokenContract.estimateGas.redeemUnderlying
    method = cTokenContract.redeemUnderlying
    args = [
      BigInt(1).toString()
    ]
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
            summary:
              'Redeem ' +
              '1' +
              ' ' +
              'ETH'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Remove',
            label: 'ETH'
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

  async function onBorrow() {
    if (!chainId || !library || !account) return
    const cTokenContract = getCTokenContract(chainId, '0x4a77faee9650b09849ff459ea1476eab01606c7a', library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    estimate = cTokenContract.estimateGas.borrow
    method = cTokenContract.borrow
    args = [
      BigInt(1).toString()
    ]
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
            summary:
              'Borrow ' +
              '1' +
              ' ' +
              'ETH'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Lend',
            action: 'Borrow',
            label: 'ETH'
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

  async function repayBorrow(isETH: boolean) {
    if (!chainId || !library || !account) return
    const cTokenContract = getCTokenContract(chainId, '0x4a77faee9650b09849ff459ea1476eab01606c7a', library, account)

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (isETH) {
      estimate = cTokenContract.estimateGas.repayBorrow
      method = cTokenContract.repayBorrow
      args = []
      value = BigNumber.from(BigInt(1).toString())
    } else {
      estimate = cTokenContract.estimateGas.repayBorrow
      method = cTokenContract.repayBorrow
      args = [
        BigInt(1).toString()
      ]
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
            summary:
              'Repay ' +
              '1' +
              ' ' +
              'ETH'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Lend',
            action: 'Repay',
            label: 'ETH'
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
  console.log('loan', allMarkets)

  return (
    <PageWrapper gap="lg" justify="center">
      <Summary allMarkets={allMarkets}></Summary>
      <MarketsWrap>
        <SupplyMarkets allMarkets={allMarkets}></SupplyMarkets>
        <BorrowMarkets allMarkets={allMarkets}></BorrowMarkets>
      </MarketsWrap>
    </PageWrapper>
  )
}
