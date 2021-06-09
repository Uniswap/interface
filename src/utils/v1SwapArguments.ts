import { MaxUint256 } from '@ethersproject/constants'
import { CurrencyAmount, ETHER, SwapParameters, Token, Trade, TradeOptions, TradeType } from '@uniswap/sdk'
import { getTradeVersion } from '../data/V1'
import { Version } from '../hooks/useToggledVersion'

function toHex(currencyAmount: CurrencyAmount): string {
  return `0x${currencyAmount.raw.toString(16)}`
}

function deadlineFromNow(ttl: number): string {
  return `0x${(Math.floor(new Date().getTime() / 1000) + ttl).toString(16)}`
}

/**
 * Get the arguments to make for a swap
 * @param trade trade to get v1 arguments for swapping
 * @param options options for swapping
 */
export default function v1SwapArguments(trade: Trade, options: Omit<TradeOptions, 'feeOnTransfer'>): SwapParameters {
  if (getTradeVersion(trade) !== Version.v1) {
    throw new Error('invalid trade version')
  }
  if (trade.route.pairs.length > 2) {
    throw new Error('too many pairs')
  }
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const inputETH = trade.inputAmount.currency === ETHER
  const outputETH = trade.outputAmount.currency === ETHER
  if (inputETH && outputETH) throw new Error('ETHER to ETHER')
  const minimumAmountOut = toHex(trade.minimumAmountOut(options.allowedSlippage))
  const maximumAmountIn = toHex(trade.maximumAmountIn(options.allowedSlippage))
  const deadline = deadlineFromNow(options.ttl)
  if (isExactIn) {
    if (inputETH) {
      return {
        methodName: 'ethToTokenTransferInput',
        args: [minimumAmountOut, deadline, options.recipient],
        value: maximumAmountIn
      }
    } else if (outputETH) {
      return {
        methodName: 'tokenToEthTransferInput',
        args: [maximumAmountIn, minimumAmountOut, deadline, options.recipient],
        value: '0x0'
      }
    } else {
      const outputToken = trade.outputAmount.currency
      // should never happen, needed for type check
      if (!(outputToken instanceof Token)) {
        throw new Error('token to token')
      }
      return {
        methodName: 'tokenToTokenTransferInput',
        args: [maximumAmountIn, minimumAmountOut, '0x1', deadline, options.recipient, outputToken.address],
        value: '0x0'
      }
    }
  } else {
    if (inputETH) {
      return {
        methodName: 'ethToTokenTransferOutput',
        args: [minimumAmountOut, deadline, options.recipient],
        value: maximumAmountIn
      }
    } else if (outputETH) {
      return {
        methodName: 'tokenToEthTransferOutput',
        args: [minimumAmountOut, maximumAmountIn, deadline, options.recipient],
        value: '0x0'
      }
    } else {
      const output = trade.outputAmount.currency
      if (!(output instanceof Token)) {
        throw new Error('invalid output amount currency')
      }

      return {
        methodName: 'tokenToTokenTransferOutput',
        args: [
          minimumAmountOut,
          maximumAmountIn,
          MaxUint256.toHexString(),
          deadline,
          options.recipient,
          output.address
        ],
        value: '0x0'
      }
    }
  }
}
