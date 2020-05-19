import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Token, Trade, TradeType, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
import { Field } from '../state/swap/actions'
import { useTransactionAdder } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { calculateGasMargin, getRouterContract, isAddress } from '../utils'
import { useENSName, useActiveWeb3React } from './index'

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
    if (tokens[Field.INPUT]?.equals(WETH[chainId])) {
      return SwapType.EXACT_ETH_FOR_TOKENS
    } else if (tokens[Field.OUTPUT]?.equals(WETH[chainId])) {
      return SwapType.EXACT_TOKENS_FOR_ETH
    } else {
      return SwapType.EXACT_TOKENS_FOR_TOKENS
    }
  } else {
    if (tokens[Field.INPUT]?.equals(WETH[chainId])) {
      return SwapType.ETH_FOR_EXACT_TOKENS
    } else if (tokens[Field.OUTPUT]?.equals(WETH[chainId])) {
      return SwapType.TOKENS_FOR_EXACT_ETH
    } else {
      return SwapType.TOKENS_FOR_EXACT_TOKENS
    }
  }
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade?: Trade, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips, optional
  deadline: number = DEFAULT_DEADLINE_FROM_NOW, // in seconds from now, optional
  to?: string // recipient of output, optional
): null | (() => Promise<string>) {
  const { account, chainId, library } = useActiveWeb3React()
  const inputAllowance = useTokenAllowance(trade?.inputAmount?.token, account, ROUTER_ADDRESS)
  const addTransaction = useTransactionAdder()
  const recipient = to ? isAddress(to) : account
  const ensName = useENSName(to)

  return useMemo(() => {
    if (!trade) return null
    if (!recipient) return null

    // will always be defined
    const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

    // no allowance
    if (
      !trade.inputAmount.token.equals(WETH[chainId]) &&
      (!inputAllowance || slippageAdjustedAmounts[Field.INPUT].greaterThan(inputAllowance))
    ) {
      return null
    }

    return async function onSwap() {
      const routerContract: Contract = getRouterContract(chainId, library, account)

      const path = trade.route.path.map(t => t.address)

      const deadlineFromNow: number = Math.ceil(Date.now() / 1000) + deadline

      const swapType = getSwapType(
        { [Field.INPUT]: trade.inputAmount.token, [Field.OUTPUT]: trade.outputAmount.token },
        trade.tradeType === TradeType.EXACT_INPUT,
        chainId
      )

      let estimate, method, args, value
      switch (swapType) {
        case SwapType.EXACT_TOKENS_FOR_TOKENS:
          estimate = routerContract.estimateGas.swapExactTokensForTokens
          method = routerContract.swapExactTokensForTokens
          args = [
            slippageAdjustedAmounts[Field.INPUT].raw.toString(),
            slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
            path,
            recipient,
            deadlineFromNow
          ]
          value = null
          break
        case SwapType.TOKENS_FOR_EXACT_TOKENS:
          estimate = routerContract.estimateGas.swapTokensForExactTokens
          method = routerContract.swapTokensForExactTokens
          args = [
            slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
            slippageAdjustedAmounts[Field.INPUT].raw.toString(),
            path,
            recipient,
            deadlineFromNow
          ]
          value = null
          break
        case SwapType.EXACT_ETH_FOR_TOKENS:
          estimate = routerContract.estimateGas.swapExactETHForTokens
          method = routerContract.swapExactETHForTokens
          args = [slippageAdjustedAmounts[Field.OUTPUT].raw.toString(), path, recipient, deadlineFromNow]
          value = BigNumber.from(slippageAdjustedAmounts[Field.INPUT].raw.toString())
          break
        case SwapType.TOKENS_FOR_EXACT_ETH:
          estimate = routerContract.estimateGas.swapTokensForExactETH
          method = routerContract.swapTokensForExactETH
          args = [
            slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
            slippageAdjustedAmounts[Field.INPUT].raw.toString(),
            path,
            recipient,
            deadlineFromNow
          ]
          value = null
          break
        case SwapType.EXACT_TOKENS_FOR_ETH:
          estimate = routerContract.estimateGas.swapExactTokensForETH
          method = routerContract.swapExactTokensForETH
          args = [
            slippageAdjustedAmounts[Field.INPUT].raw.toString(),
            slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
            path,
            recipient,
            deadlineFromNow
          ]
          value = null
          break
        case SwapType.ETH_FOR_EXACT_TOKENS:
          estimate = routerContract.estimateGas.swapETHForExactTokens
          method = routerContract.swapETHForExactTokens
          args = [slippageAdjustedAmounts[Field.OUTPUT].raw.toString(), path, recipient, deadlineFromNow]
          value = BigNumber.from(slippageAdjustedAmounts[Field.INPUT].raw.toString())
          break
      }

      return estimate(...args, value ? { value } : {})
        .then(estimatedGasLimit =>
          method(...args, {
            ...(value ? { value } : {}),
            gasLimit: calculateGasMargin(estimatedGasLimit)
          })
        )
        .then(response => {
          if (recipient === account) {
            addTransaction(response, {
              summary:
                'Swap ' +
                slippageAdjustedAmounts[Field.INPUT].toSignificant(3) +
                ' ' +
                trade.inputAmount.token.symbol +
                ' for ' +
                slippageAdjustedAmounts[Field.OUTPUT].toSignificant(3) +
                ' ' +
                trade.outputAmount.token.symbol
            })
          } else {
            addTransaction(response, {
              summary:
                'Swap ' +
                slippageAdjustedAmounts[Field.INPUT].toSignificant(3) +
                ' ' +
                trade.inputAmount.token.symbol +
                ' for ' +
                slippageAdjustedAmounts[Field.OUTPUT].toSignificant(3) +
                ' ' +
                trade.outputAmount.token.symbol +
                ' to ' +
                (ensName ?? recipient)
            })
          }

          return response.hash
        })
        .catch(error => {
          console.error(`Swap or gas estimate failed`, error)
          throw error
        })
    }
  }, [account, allowedSlippage, addTransaction, chainId, deadline, inputAllowance, library, trade, ensName, recipient])
}
