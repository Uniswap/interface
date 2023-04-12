import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useMemo } from 'react'

import { useTransactionAdder } from '../state/transactions/hooks'
import { TransactionType } from '../state/transactions/types'
import { currencyId } from '../utils/currencyId'
import useTransactionDeadline from './useTransactionDeadline'
import { useUniversalRouterSwapCallback } from './useUniversalRouter'
import { Contract } from "ethers"
import { useWeb3React } from '@web3-react/core'
import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import LeverageManagerData from "../perpspotContracts/LeverageManager.json"
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
  poolAddress: string,
  allowedSlippage: Percent, // in bips
  values: { amountIn: number | undefined; amountOut: number | undefined }, // amountOut -> borrowAmount
  isLong: boolean // if isLong then amountIn is in token0, otherwise amountIn is in token1
) {
  const deadline = useTransactionDeadline()
  const { account, chainId, provider } = useWeb3React()
  const addTransaction = useTransactionAdder()

  // compute leverage manager address
  let leverageManagerAddress = computeLeverageManagerAddress(poolAddress)

  const callback = useMemo( () => {
    if (!account) throw new Error('missing account')
    if (!chainId) throw new Error('missing chainId')
    if (!provider) throw new Error('missing provider')

    const leverageManagerContract = new Contract(leverageManagerAddress, LeverageManagerData.abi, provider.getSigner())
    
    leverageManagerContract.createLevPosition(
      values.amountIn,
      allowedSlippage.toFixed(2),
      values.amountOut,
      isLong
    )
    
  }, [poolAddress, values, isLong, allowedSlippage, deadline, account, chainId])
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