import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import {
  ChainId,
  CurrencyAmount,
  ETHER,
  JSBI,
  Percent,
  SwapParameters,
  TokenAmount,
  TradeOptions,
  TradeOptionsDeadline,
  TradeType,
  validateAndParseAddress
} from '@dynamic-amm/sdk'
import { useMemo } from 'react'
import { BIPS_BASE, ETHER_ADDRESS, INITIAL_ALLOWED_SLIPPAGE, ROUTER_ADDRESSES_V2 } from '../constants'
import { useTransactionAdder } from 'state/transactions/hooks'
import {
  calculateGasMargin,
  getAggregationExecutorAddress,
  getAggregationExecutorContract,
  getRouterV2Contract,
  isAddress,
  shortenAddress
} from 'utils'
import isZero from '../utils/isZero'
import { useActiveWeb3React } from './index'
import useTransactionDeadline from './useTransactionDeadline'
import useENS from './useENS'
import { convertToNativeTokenFromETH } from 'utils/dmm'
import {
  Aggregator,
  encodeFeeConfig,
  encodeSimpleModeData,
  encodeSwapExecutor,
  isEncodeUniswapCallback
} from 'utils/aggregator'
import invariant from 'tiny-invariant'
import { Web3Provider } from '@ethersproject/providers'
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
  args: Array<string | Array<string | string[]>>
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

interface FeeConfig {
  chargeFeeBy: 'tokenIn' | 'tokenOut'
  feeReceiver: string
  isInBps: boolean
  feeAmount: string
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

  // TODO: Change later.
  const feeConfig: FeeConfig | undefined = undefined as any
  // const feeConfig: FeeConfig | undefined = {
  //   chargeFeeBy: 'tokenIn',
  //   feeReceiver: '0x16368dD7e94f177B8C2c028Ef42289113D328121',
  //   isInBps: true,
  //   feeAmount: '10'
  // } as any
  const destTokenFeeData =
    feeConfig && feeConfig.chargeFeeBy === 'tokenOut'
      ? encodeFeeConfig({
          feeReceiver: feeConfig.feeReceiver,
          isInBps: feeConfig.isInBps,
          feeAmount: feeConfig.feeAmount
        })
      : '0x'
  let methodNames: string[] = []
  let args: Array<string | Array<string | string[]>> = []
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
      const aggregationExecutorContract = getAggregationExecutorContract(chainId, library)
      const src: { [p: string]: BigNumber } = {}
      const isEncodeUniswap = isEncodeUniswapCallback(chainId)
      if (feeConfig && feeConfig.chargeFeeBy === 'tokenIn') {
        const { feeReceiver, isInBps, feeAmount } = feeConfig
        src[feeReceiver] = isInBps
          ? BigNumber.from(amountIn)
              .mul(feeAmount)
              .div('100')
          : BigNumber.from(feeAmount)
      }
      // Use swap simple mode when tokenIn is not ETH and every firstPool is encoded by uniswap.
      let isUseSwapSimpleMode = !etherIn
      if (isUseSwapSimpleMode) {
        for (let i = 0; i < trade.swaps.length; i++) {
          const sequence = trade.swaps[i]
          const firstPool = sequence[0]
          if (!isEncodeUniswap(firstPool)) {
            isUseSwapSimpleMode = false
            break
          }
        }
      }
      const getSwapSimpleModeArgs = () => {
        const firstPools: string[] = []
        const firstSwapAmounts: string[] = []
        trade.swaps.forEach(sequence => {
          for (let i = 0; i < sequence.length; i++) {
            if (i === 0) {
              const firstPool = sequence[0]
              firstPools.push(firstPool.pool)
              firstSwapAmounts.push(firstPool.swapAmount)
              if (isEncodeUniswap(firstPool)) {
                firstPool.collectAmount = '0'
              }
              if (sequence.length === 1 && isEncodeUniswap(firstPool)) {
                firstPool.recipient =
                  etherOut || feeConfig?.chargeFeeBy === 'tokenOut' ? aggregationExecutorAddress : to
              }
            } else {
              const A = sequence[i - 1]
              const B = sequence[i]
              if (isEncodeUniswap(A) && isEncodeUniswap(B)) {
                A.recipient = B.pool
                B.collectAmount = '0'
              } else if (isEncodeUniswap(B)) {
                B.collectAmount = '1'
              } else if (isEncodeUniswap(A)) {
                A.recipient = aggregationExecutorAddress
              }
              if (i === sequence.length - 1 && isEncodeUniswap(B)) {
                B.recipient = etherOut || feeConfig?.chargeFeeBy === 'tokenOut' ? aggregationExecutorAddress : to
              }
            }
          }
        })
        const swapSequences = encodeSwapExecutor(trade.swaps, chainId)
        const sumSrcAmounts = Object.values(src).reduce((sum, value) => sum.add(value), BigNumber.from('0'))
        const sumFirstSwapAmounts = firstSwapAmounts.reduce((sum, value) => sum.add(value), BigNumber.from('0'))
        const amount = sumSrcAmounts.add(sumFirstSwapAmounts).toString()
        const swapDesc = [
          tokenIn,
          tokenOut,
          Object.keys(src), // srcReceivers
          Object.values(src).map(amount => amount.toString()), // srcAmounts
          to,
          amount,
          amountOut,
          numberToHex(32),
          destTokenFeeData
        ]
        const executorDataForSwapSimpleMode = encodeSimpleModeData({
          firstPools,
          firstSwapAmounts,
          swapSequences,
          deadline,
          destTokenFeeData
        })
        args = [aggregationExecutorAddress, swapDesc, executorDataForSwapSimpleMode]
      }
      const getSwapNormalModeArgs = () => {
        trade.swaps.forEach(sequence => {
          for (let i = 0; i < sequence.length; i++) {
            if (i === 0) {
              const firstPool = sequence[0]
              if (etherIn) {
                if (isEncodeUniswap(firstPool)) {
                  firstPool.collectAmount = firstPool.swapAmount
                }
              } else {
                if (isEncodeUniswap(firstPool)) {
                  firstPool.collectAmount = firstPool.swapAmount
                }
                src[aggregationExecutorAddress] = BigNumber.from(firstPool.swapAmount).add(
                  src[aggregationExecutorAddress] ?? '0'
                )
              }
              if (sequence.length === 1 && isEncodeUniswap(firstPool)) {
                firstPool.recipient =
                  etherOut || feeConfig?.chargeFeeBy === 'tokenOut' ? aggregationExecutorAddress : to
              }
            } else {
              const A = sequence[i - 1]
              const B = sequence[i]
              if (isEncodeUniswap(A) && isEncodeUniswap(B)) {
                A.recipient = B.pool
                B.collectAmount = '0'
              } else if (isEncodeUniswap(B)) {
                B.collectAmount = '1'
              } else if (isEncodeUniswap(A)) {
                A.recipient = aggregationExecutorAddress
              }
              if (i === sequence.length - 1 && isEncodeUniswap(B)) {
                B.recipient = etherOut || feeConfig?.chargeFeeBy === 'tokenOut' ? aggregationExecutorAddress : to
              }
            }
          }
        })
        const swapSequences = encodeSwapExecutor(trade.swaps, chainId)
        const swapDesc = [
          tokenIn,
          tokenOut,
          Object.keys(src), // srcReceivers
          Object.values(src).map(amount => amount.toString()), // srcAmounts
          to,
          amountIn,
          amountOut,
          etherIn ? numberToHex(0) : numberToHex(4),
          destTokenFeeData
        ]
        let executorData = aggregationExecutorContract.interface.encodeFunctionData('nameDoesntMatter', [
          [swapSequences, tokenIn, tokenOut, amountOut, to, deadline, destTokenFeeData]
        ])
        // Remove method id (slice 10).
        executorData = '0x' + executorData.slice(10)
        args = [aggregationExecutorAddress, swapDesc, executorData]
      }
      if (isUseSwapSimpleMode) {
        getSwapSimpleModeArgs()
      } else {
        getSwapNormalModeArgs()
      }
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
  // const tradeBestExactInAnyway = useTradeExactIn(trade?.inputAmount, trade?.outputAmount.currency || undefined)
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

  const addTransactionWithType = useTransactionAdder()

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
                    return {
                      call,
                      error: new Error(
                        'estimatedCalls exception: Unexpected issue with estimating the gas. Please try again.'
                      )
                    }
                  })
                  .catch(callError => {
                    console.debug('Call threw error', call, callError)
                    const reason = callError.reason || callError.data?.message || callError.message
                    // switch (reason) {
                    //   case 'execution reverted: DmmExchangeRouter: INSUFFICIENT_OUTPUT_AMOUNT':
                    //   case 'execution reverted: DmmExchangeRouter: EXCESSIVE_INPUT_AMOUNT':
                    //     errorMessage =
                    //       'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
                    //     break
                    //   default:
                    //     errorMessage = `The transaction cannot succeed due to error: ${reason}. This is probably an issue with one of the tokens you are swapping.`
                    // }
                    return { call, error: new Error('estimatedCalls exception: ' + reason) }
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
          throw new Error(
            'gasEstimate not found: Unexpected error. Please contact support: none of the calls threw an error'
          )
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

            const base = `${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
            const withRecipient =
              recipient === account
                ? undefined
                : `to ${
                    recipientAddressOrName && isAddress(recipientAddressOrName)
                      ? shortenAddress(recipientAddressOrName)
                      : recipientAddressOrName
                  }`

            addTransactionWithType(response, {
              type: 'Swap',
              summary: `${base} ${withRecipient ?? ''}`,
              arbitrary: {
                inputSymbol,
                outputSymbol,
                inputDecimals: trade.inputAmount.currency.decimals,
                outputDecimals: trade.outputAmount.currency.decimals,
                withRecipient
              }
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
  }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, addTransactionWithType])
}
