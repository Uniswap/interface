import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useMemo } from 'react'

import { useTransactionAdder } from '../state/transactions/hooks'
import { TransactionType } from '../state/transactions/types'
import { currencyId } from '../utils/currencyId'
import useTransactionDeadline from './useTransactionDeadline'
import { useUniversalRouterSwapCallback } from './useUniversalRouter'
import {Contract } from "ethers"
import { useWeb3React } from '@web3-react/core'
import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import LeverageManagerData from "../perpspotContracts/LeverageManager.json"
import { BigNumber as BN } from "bignumber.js";

import { arrayify } from 'ethers/lib/utils'

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  fiatValues: { amountIn: number | undefined; amountOut: number | undefined }, // usd values for amount in and out, logged for analytics
  allowedSlippage: Percent, // in bips
  permitSignature: PermitSignature | undefined
): { callback: null | (() => Promise<string>) } {
  const deadline = useTransactionDeadline()

  const addTransaction = useTransactionAdder()
  // console.log("allowedSlippage", allowedSlippage)
  const universalRouterSwapCallback = useUniversalRouterSwapCallback(trade, fiatValues, {
    slippageTolerance: allowedSlippage,
    deadline,
    permit: permitSignature,
  })
  const swapCallback = universalRouterSwapCallback

  const callback = useMemo(() => {
    if (!trade || !swapCallback) return null
    
    return () =>
      swapCallback().then((response) => {
        addTransaction(
          response,
          trade.tradeType === TradeType.EXACT_INPUT
            ? {
                type: TransactionType.SWAP,
                tradeType: TradeType.EXACT_INPUT,
                inputCurrencyId: currencyId(trade.inputAmount.currency),
                inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                outputCurrencyId: currencyId(trade.outputAmount.currency),
                minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
              }
            : {
                type: TransactionType.SWAP,
                tradeType: TradeType.EXACT_OUTPUT,
                inputCurrencyId: currencyId(trade.inputAmount.currency),
                maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
                outputCurrencyId: currencyId(trade.outputAmount.currency),
                outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
              }
        )
        return response.hash
      })
  }, [addTransaction, allowedSlippage, swapCallback, trade])

  return {
    callback,
  }
}


// function createLevPosition(
//   uint256 traderFund,
//   uint256 maxSlippage,
//   uint256 borrowAmount,
//   bool isLong // if long borrow token1 to buy token 0
// )

const LEVERAGE_MANAGER_INIT_CODE_HASH = "0x96aa3c987863e85b14d6639858b42e28f0f6892b08af1dc757a3d389d4d88e0b"
const LEVERAGE_MANAGER_FACTORY_ADDRESS = ""
export function useLeverageBorrowCallback(
  leverageManagerAddress: string | undefined,
  trade: Trade<Currency, Currency, TradeType> | undefined,  
  allowedSlippage: Percent, // in bips
  leverageFactor: string | undefined
) {
  // const deadline = useTransactionDeadline()
  const { account, chainId, provider } = useWeb3React()

  // compute leverage manager address

  const callback = useMemo(() => {
    if (!leverageManagerAddress) return null
    if (!trade) return null
    if (!account) throw new Error('missing account')
    if (!chainId) throw new Error('missing chainId')
    if (!provider) throw new Error('missing provider')

    let isLong = false
    let decimals = trade?.inputAmount.currency.decimals ?? 18
    if (trade?.inputAmount.currency.isToken && trade?.outputAmount.currency.isToken) {
      if (trade.inputAmount.currency.sortsBefore(trade.outputAmount.currency)) {
        isLong = true
      }
    }

    let input = new BN(trade?.inputAmount.toExact() ?? 0).shiftedBy(decimals).toFixed(0)
    let borrowedAmount = new BN(trade?.inputAmount.toExact() ?? 0).multipliedBy(leverageFactor ?? "0").minus(trade?.inputAmount.toExact() ?? 0).shiftedBy(decimals).toFixed(0)
    const leverageManagerContract = new Contract(leverageManagerAddress, LeverageManagerData.abi, provider.getSigner())
    return () => {
      leverageManagerContract.createLevPosition(
        input,
        new BN(allowedSlippage.toFixed(2)).shiftedBy(decimals).toFixed(0),
        borrowedAmount,
        isLong
      )
    }
  }, [leverageManagerAddress, allowedSlippage, account, chainId])
  return callback;
}

export function computeLeverageManagerAddress(
  pool: string
): string {
  
  return getCreate2Address(
    LEVERAGE_MANAGER_FACTORY_ADDRESS,
    keccak256(['bytes'], [defaultAbiCoder.encode(['address'], [pool])]),
    LEVERAGE_MANAGER_INIT_CODE_HASH
  )
}