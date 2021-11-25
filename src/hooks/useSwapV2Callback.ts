import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import {
  CurrencyAmount,
  ChainId,
  ETHER,
  JSBI,
  Percent,
  SwapParameters,
  TradeOptions,
  TradeOptionsDeadline,
  TradeType,
  TokenAmount,
  validateAndParseAddress
} from '@dynamic-amm/sdk'
import { useMemo } from 'react'
import { BIPS_BASE, ETHER_ADDRESS, INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { useTransactionAdder } from '../state/transactions/hooks'
import {
  calculateGasMargin,
  getAggregationExecutorAddress,
  getAggregationExecutorContract,
  getRouterV2Contract,
  isAddress,
  shortenAddress
} from '../utils'
import isZero from '../utils/isZero'
import { useActiveWeb3React } from './index'
import useTransactionDeadline from './useTransactionDeadline'
import useENS from './useENS'
import { convertToNativeTokenFromETH } from 'utils/dmm'
import { Aggregator, encodeSwapExecutor } from '../utils/aggregator'
import invariant from 'tiny-invariant'
import { Web3Provider } from '@ethersproject/providers'

import { ROUTER_ADDRESSES_V2 } from '../constants'
import { formatCurrencyAmount } from 'utils/formatBalance'

/**
 * The parameters to use in the call to the DmmExchange Router to execute a trade.
 */
interface SwapV2Parameters {
  /**
   * The method to call on the DmmExchange Router.
   */
  methodNames: string[]
  /**
   * The arguments to pass to the method, all hex encoded.
   */
  args: Array<string | string[]>
  // args: any[]
  /**
   * The amount of wei to send in hex.
   */
  value: string
}

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID
}

interface SwapCall {
  contract: Contract
  parameters: SwapParameters
}

interface SuccessfulCall {
  call: SwapCall
  gasEstimate: BigNumber
}

interface FailedCall {
  call: SwapCall
  error: Error
}

type EstimatedSwapCall = SuccessfulCall | FailedCall

function toHex(currencyAmount: CurrencyAmount) {
  return `0x${currencyAmount.raw.toString(16)}`
}

function numberToHex(num: number) {
  return `0x${num.toString(16)}`
}

function toSwapAddress(currencyAmount: CurrencyAmount) {
  if (currencyAmount.currency === ETHER) {
    return ETHER_ADDRESS
  }
  return currencyAmount instanceof TokenAmount ? currencyAmount.token.address : ''
}

const ZERO_HEX = '0x0'

function getSwapCallParameters(
  trade: Aggregator,
  options: TradeOptions | TradeOptionsDeadline,
  chainId: ChainId,
  library: Web3Provider
): SwapV2Parameters {
  const etherIn = trade.inputAmount.currency === ETHER
  const etherOut = trade.outputAmount.currency === ETHER
  // the router does not support both ether in and out
  invariant(!(etherIn && etherOut), 'ETHER_IN_OUT')
  invariant(!('ttl' in options) || options.ttl > 0, 'TTL')

  const to: string = validateAndParseAddress(options.recipient)
  const tokenIn: string = toSwapAddress(trade.inputAmount)
  const tokenOut: string = toSwapAddress(trade.outputAmount)
  const amountIn: string = toHex(trade.maximumAmountIn(options.allowedSlippage))
  const amountOut: string = toHex(trade.minimumAmountOut(options.allowedSlippage))
  const deadline =
    'ttl' in options
      ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
      : `0x${options.deadline.toString(16)}`

  // const useFeeOnTransfer = Boolean(options.feeOnTransfer)

  let methodNames: string[] = []
  let args: (string | string[])[] = []
  let value: string = ZERO_HEX

  switch (trade.tradeType) {
    case TradeType.EXACT_INPUT: {
      methodNames = ['swap']
      if (!tokenIn || !tokenOut || !amountIn || !amountOut) {
        break
      }
      const aggregationExecutorAddress = getAggregationExecutorAddress(chainId)
      if (!aggregationExecutorAddress) {
        break
      }
      const swapDesc = [
        tokenIn,
        tokenOut,
        aggregationExecutorAddress,
        to,
        amountIn,
        amountOut,
        etherIn ? numberToHex(0) : numberToHex(4),
        '0x'
      ]
      const swapSequences = encodeSwapExecutor(trade.swaps, chainId)
      const aggregationExecutorContract = getAggregationExecutorContract(chainId, library)
      let executorData = aggregationExecutorContract.interface.encodeFunctionData('getCallByte', [
        [swapSequences, tokenIn, tokenOut, amountOut, to, deadline]
      ])
      // to split input data (without method ID)
      executorData = '0x' + executorData.slice(10)
      args = [aggregationExecutorAddress, swapDesc, executorData]
      value = etherIn ? amountIn : ZERO_HEX
      break
    }
  }
  return {
    methodNames,
    args,
    value
  }
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 */
function useSwapV2CallArguments(
  trade: Aggregator | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()
  // const tradeBestExacInAnyway = useTradeExactIn(trade?.inputAmount, trade?.outputAmount.currency || undefined)
  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !chainId || !deadline || !(ROUTER_ADDRESSES_V2[chainId] || ''))
      return []

    const contract: Contract | null = getRouterV2Contract(chainId, library, account)
    if (!contract) {
      return []
    }
    const { methodNames, args, value } = getSwapCallParameters(
      trade,
      {
        allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
        recipient,
        deadline: deadline.toNumber()
      },
      chainId,
      library
    )
    const swapMethods = methodNames.map(methodName => ({
      methodName,
      args,
      value
    }))

    return swapMethods.map(parameters => ({ parameters, contract }))
  }, [account, allowedSlippage, chainId, deadline, library, recipient, trade])
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapV2Callback(
  trade: Aggregator | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const swapCalls = useSwapV2CallArguments(trade, allowedSlippage, recipientAddressOrName)

  const addTransaction = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(): Promise<string> {
        const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
          swapCalls.map(call => {
            const {
              parameters: { methodName, args, value },
              contract
            } = call
            const options = !value || isZero(value) ? {} : { value }

            return contract.estimateGas[methodName](...args, options)
              .then(gasEstimate => {
                return {
                  call,
                  gasEstimate
                }
              })
              .catch(gasError => {
                console.debug('Gas estimate failed, trying eth_call to extract error', call)
                console.log('%c ...', 'background: #009900; color: #fff', methodName, args, options)

                return contract.callStatic[methodName](...args, options)
                  .then(result => {
                    console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                    return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
                  })
                  .catch(callError => {
                    console.debug('Call threw error', call, callError)
                    let errorMessage: string
                    const reason = callError.reason || callError.data?.message || callError.message
                    switch (reason) {
                      case 'execution reverted: DmmExchangeRouter: INSUFFICIENT_OUTPUT_AMOUNT':
                      case 'execution reverted: DmmExchangeRouter: EXCESSIVE_INPUT_AMOUNT':
                        errorMessage =
                          'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
                        break
                      default:
                        errorMessage = `The transaction cannot succeed due to error: ${reason}. This is probably an issue with one of the tokens you are swapping.`
                    }
                    return { call, error: new Error(errorMessage) }
                  })
              })
          })
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        const successfulEstimation = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
        )
        // return new Promise((resolve, reject) => resolve(""))
        if (!successfulEstimation) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          throw new Error('Unexpected error. Please contact support: none of the calls threw an error')
        }

        const {
          call: {
            contract,
            parameters: { methodName, args, value }
          },
          gasEstimate
        } = successfulEstimation

        return contract[methodName](...args, {
          gasLimit: calculateGasMargin(gasEstimate),
          ...(value && !isZero(value) ? { value, from: account } : { from: account })
        })
          .then((response: any) => {
            const inputSymbol = convertToNativeTokenFromETH(trade.inputAmount.currency, chainId).symbol
            const outputSymbol = convertToNativeTokenFromETH(trade.outputAmount.currency, chainId).symbol
            const inputAmount = formatCurrencyAmount(trade.inputAmount)
            const outputAmount = formatCurrencyAmount(trade.outputAmount)

            const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
            const withRecipient =
              recipient === account
                ? base
                : `${base} to ${
                    recipientAddressOrName && isAddress(recipientAddressOrName)
                      ? shortenAddress(recipientAddressOrName)
                      : recipientAddressOrName
                  }`

            addTransaction(response, {
              summary: withRecipient
            })

            return response.hash
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error, methodName, args, value)
              throw new Error(`Swap failed: ${error.message}`)
            }
          })
      },
      error: null
    }
  }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, addTransaction])
}
