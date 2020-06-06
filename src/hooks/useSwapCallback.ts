import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { ChainId, Token, Trade, TradeType, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
import { Field } from '../state/swap/actions'
import { useTransactionAdder } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { calculateGasMargin, getRouterContract, isAddress } from '../utils'
import { useActiveWeb3React } from './index'
import useENSName from './useENSName'

enum SwapType {
  EXACT_TOKENS_FOR_TOKENS,
  EXACT_TOKENS_FOR_ETH,
  EXACT_ETH_FOR_TOKENS,
  TOKENS_FOR_EXACT_TOKENS,
  TOKENS_FOR_EXACT_ETH,
  ETH_FOR_EXACT_TOKENS
}

function getSwapType(tokens: { [field in Field]?: Token }, isExactIn: boolean, chainId: number): SwapType {
  if (isExactIn) {
    if (tokens[Field.INPUT]?.equals(WETH[chainId as ChainId])) {
      return SwapType.EXACT_ETH_FOR_TOKENS
    } else if (tokens[Field.OUTPUT]?.equals(WETH[chainId as ChainId])) {
      return SwapType.EXACT_TOKENS_FOR_ETH
    } else {
      return SwapType.EXACT_TOKENS_FOR_TOKENS
    }
  } else {
    if (tokens[Field.INPUT]?.equals(WETH[chainId as ChainId])) {
      return SwapType.ETH_FOR_EXACT_TOKENS
    } else if (tokens[Field.OUTPUT]?.equals(WETH[chainId as ChainId])) {
      return SwapType.TOKENS_FOR_EXACT_ETH
    } else {
      return SwapType.TOKENS_FOR_EXACT_TOKENS
    }
  }
}

// list of checksummed addresses that are forced to go through the FoT methods
const FORCED_FOT_TOKENS = ['0xF0FAC7104aAC544e4a7CE1A55ADF2B5a25c65bD1']

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade?: Trade, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips, optional
  deadline: number = DEFAULT_DEADLINE_FROM_NOW, // in seconds from now, optional
  to?: string // recipient of output, optional
): null | (() => Promise<string>) {
  const { account, chainId, library } = useActiveWeb3React()
  const inputAllowance = useTokenAllowance(trade?.inputAmount?.token, account ?? undefined, ROUTER_ADDRESS)
  const addTransaction = useTransactionAdder()
  const recipient = to ? isAddress(to) : account
  const ensName = useENSName(to)

  return useMemo(() => {
    if (!trade || !recipient) return null

    // will always be defined
    const {
      [Field.INPUT]: slippageAdjustedInput,
      [Field.OUTPUT]: slippageAdjustedOutput
    } = computeSlippageAdjustedAmounts(trade, allowedSlippage)

    if (!slippageAdjustedInput || !slippageAdjustedOutput) return null

    // no allowance
    if (
      !trade.inputAmount.token.equals(WETH[chainId as ChainId]) &&
      (!inputAllowance || slippageAdjustedInput.greaterThan(inputAllowance))
    ) {
      return null
    }

    return async function onSwap() {
      if (!chainId || !library || !account) {
        throw new Error('missing dependencies in onSwap callback')
      }

      const routerContract: Contract = getRouterContract(chainId, library, account)

      const path = trade.route.path.map(t => t.address)
      const isForcedFOT: boolean = path.some(tokenAddress => FORCED_FOT_TOKENS.indexOf(tokenAddress) !== -1)

      const deadlineFromNow: number = Math.ceil(Date.now() / 1000) + deadline

      const swapType = getSwapType(
        { [Field.INPUT]: trade.inputAmount.token, [Field.OUTPUT]: trade.outputAmount.token },
        trade.tradeType === TradeType.EXACT_INPUT,
        chainId as ChainId
      )

      // let estimate: Function, method: Function,
      let methodNames: string[],
        args: Array<string | string[] | number>,
        value: BigNumber | null = null
      switch (swapType) {
        case SwapType.EXACT_TOKENS_FOR_TOKENS:
          methodNames = isForcedFOT
            ? ['swapExactTokensForTokensSupportingFeeOnTransferTokens']
            : ['swapExactTokensForTokens', 'swapExactTokensForTokensSupportingFeeOnTransferTokens']
          args = [
            slippageAdjustedInput.raw.toString(),
            slippageAdjustedOutput.raw.toString(),
            path,
            recipient,
            deadlineFromNow
          ]
          break
        case SwapType.TOKENS_FOR_EXACT_TOKENS:
          methodNames = ['swapTokensForExactTokens']
          args = [
            slippageAdjustedOutput.raw.toString(),
            slippageAdjustedInput.raw.toString(),
            path,
            recipient,
            deadlineFromNow
          ]
          break
        case SwapType.EXACT_ETH_FOR_TOKENS:
          methodNames = isForcedFOT
            ? ['swapExactETHForTokensSupportingFeeOnTransferTokens']
            : ['swapExactETHForTokens', 'swapExactETHForTokensSupportingFeeOnTransferTokens']
          args = [slippageAdjustedOutput.raw.toString(), path, recipient, deadlineFromNow]
          value = BigNumber.from(slippageAdjustedInput.raw.toString())
          break
        case SwapType.TOKENS_FOR_EXACT_ETH:
          methodNames = ['swapTokensForExactETH']
          args = [
            slippageAdjustedOutput.raw.toString(),
            slippageAdjustedInput.raw.toString(),
            path,
            recipient,
            deadlineFromNow
          ]
          break
        case SwapType.EXACT_TOKENS_FOR_ETH:
          methodNames = isForcedFOT
            ? ['swapExactTokensForETHSupportingFeeOnTransferTokens']
            : ['swapExactTokensForETH', 'swapExactTokensForETHSupportingFeeOnTransferTokens']
          args = [
            slippageAdjustedInput.raw.toString(),
            slippageAdjustedOutput.raw.toString(),
            path,
            recipient,
            deadlineFromNow
          ]
          break
        case SwapType.ETH_FOR_EXACT_TOKENS:
          methodNames = ['swapETHForExactTokens']
          args = [slippageAdjustedOutput.raw.toString(), path, recipient, deadlineFromNow]
          value = BigNumber.from(slippageAdjustedInput.raw.toString())
          break
      }

      const safeGasEstimates = await Promise.all(
        methodNames.map(methodName =>
          routerContract.estimateGas[methodName](...args, value ? { value } : {})
            .then(calculateGasMargin)
            .catch(error => {
              console.error(`estimateGas failed for ${methodName}`, error)
            })
        )
      )

      const indexOfSuccessfulEstimation = safeGasEstimates.findIndex(safeGasEstimate =>
        BigNumber.isBigNumber(safeGasEstimate)
      )

      // all estimations failed...
      if (indexOfSuccessfulEstimation === -1) {
        // if only 1 method exists, either:
        // a) the token is doing something weird not related to FoT (e.g. enforcing a whitelist)
        // b) the token is FoT and the user specified an exact output, which is not allowed
        if (methodNames.length === 1) {
          throw Error(
            `An error occurred. If either of the tokens you're swapping take a fee on transfer, you must specify an exact input amount.`
          )
        }
        // if 2 methods exists, either:
        // a) the token is doing something weird not related to FoT (e.g. enforcing a whitelist)
        // b) the token is FoT and is taking more than the specified slippage
        else if (methodNames.length === 2) {
          throw Error(
            `An error occurred. If either of the tokens you're swapping take a fee on transfer, you must specify a slippage tolerance higher than the fee.`
          )
        } else {
          throw Error('This transaction would fail. Please contact support.')
        }
      } else {
        const methodName = methodNames[indexOfSuccessfulEstimation]
        const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

        return routerContract[methodName](...args, {
          gasLimit: safeGasEstimate,
          ...(value ? { value } : {})
        })
          .then((response: any) => {
            if (recipient === account) {
              addTransaction(response, {
                summary:
                  'Swap ' +
                  slippageAdjustedInput.toSignificant(3) +
                  ' ' +
                  trade.inputAmount.token.symbol +
                  ' for ' +
                  slippageAdjustedOutput.toSignificant(3) +
                  ' ' +
                  trade.outputAmount.token.symbol
              })
            } else {
              addTransaction(response, {
                summary:
                  'Swap ' +
                  slippageAdjustedInput.toSignificant(3) +
                  ' ' +
                  trade.inputAmount.token.symbol +
                  ' for ' +
                  slippageAdjustedOutput.toSignificant(3) +
                  ' ' +
                  trade.outputAmount.token.symbol +
                  ' to ' +
                  (ensName ?? recipient)
              })
            }

            return response.hash
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw error
            }
            // otherwise, the error was unexpected and we need to convey that
            else {
              console.error(`swap failed for ${methodName}`, error)
              throw Error('An error occurred while swapping. Please contact support.')
            }
          })
      }
    }
  }, [account, allowedSlippage, addTransaction, chainId, deadline, inputAllowance, library, trade, ensName, recipient])
}
