import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { CurrencyAmount, Percent, TradeType, ChainId, validateAndParseAddress, Currency } from '@kyberswap/ks-sdk-core'
import { SwapParameters, TradeOptions, TradeOptionsDeadline } from '@kyberswap/ks-sdk-classic'
import JSBI from 'jsbi'
import { useMemo, useCallback } from 'react'
import { BIPS_BASE, ETHER_ADDRESS, INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { useTransactionAdder } from 'state/transactions/hooks'
import {
  calculateGasMargin,
  getAggregationExecutorAddress,
  getAggregationExecutorContract,
  getRouterV2Contract,
  isAddress,
  shortenAddress,
} from 'utils'
import isZero from '../utils/isZero'
import { useActiveWeb3React } from './index'
import useTransactionDeadline from './useTransactionDeadline'
import useENS from './useENS'
import {
  Aggregator,
  encodeFeeConfig,
  encodeParameters,
  encodeSimpleModeData,
  encodeSwapExecutor,
  isEncodeUniswapCallback,
} from 'utils/aggregator'
import invariant from 'tiny-invariant'
import { TransactionResponse, Web3Provider } from '@ethersproject/providers'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { ethers } from 'ethers'
import { useSwapState } from 'state/swap/hooks'
import { getAmountPlusFeeInQuotient } from 'utils/fee'
import { NETWORKS_INFO } from 'constants/networks'
import useSendTransactionCallback from 'hooks/useSendTransactionCallback'

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
  VALID,
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

export interface FeeConfig {
  chargeFeeBy: 'currency_in' | 'currency_out'
  feeReceiver: string
  isInBps: boolean
  feeAmount: string
}

type EstimatedSwapCall = SuccessfulCall | FailedCall

function toHex(currencyAmount: CurrencyAmount<Currency>) {
  return `0x${currencyAmount.quotient.toString(16)}`
}

function numberToHex(num: number) {
  return `0x${num.toString(16)}`
}

function toSwapAddress(currencyAmount: CurrencyAmount<Currency>) {
  if (currencyAmount.currency.isNative) {
    return ETHER_ADDRESS
  }
  return currencyAmount.currency.address
}

const ZERO_HEX = '0x0'

function getSwapCallParameters(
  trade: Aggregator,
  options: TradeOptions | TradeOptionsDeadline,
  chainId: ChainId,
  library: Web3Provider,
  feeConfig: FeeConfig | undefined,
  clientData: Record<string, any>,
): SwapV2Parameters {
  const etherIn = trade.inputAmount.currency.isNative
  const etherOut = trade.outputAmount.currency.isNative

  // the router does not support both ether in and out
  invariant(!(etherIn && etherOut), 'ETHER_IN_OUT')
  invariant(!('ttl' in options) || options.ttl > 0, 'TTL')

  const to: string = validateAndParseAddress(options.recipient)
  const tokenIn: string = toSwapAddress(trade.inputAmount)
  const tokenOut: string = toSwapAddress(trade.outputAmount)
  const amountIn: string = toHex(trade.maximumAmountIn(options.allowedSlippage))
  const amountWithFeeIn: string =
    feeConfig && feeConfig.chargeFeeBy === 'currency_in' ? getAmountPlusFeeInQuotient(amountIn, feeConfig) : amountIn
  const amountOut: string = toHex(trade.minimumAmountOut(options.allowedSlippage))
  const deadline =
    'ttl' in options
      ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
      : `0x${options.deadline.toString(16)}`
  // const useFeeOnTransfer = Boolean(options.feeOnTransfer)

  const destTokenFeeData =
    feeConfig && feeConfig.chargeFeeBy === 'currency_out'
      ? encodeFeeConfig({
          feeReceiver: feeConfig.feeReceiver,
          isInBps: feeConfig.isInBps,
          feeAmount: feeConfig.feeAmount,
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
      if (feeConfig && feeConfig.chargeFeeBy === 'currency_in') {
        const { feeReceiver } = feeConfig

        src[feeReceiver] = BigNumber.from(amountWithFeeIn).sub(amountIn)
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
                  etherOut || feeConfig?.chargeFeeBy === 'currency_out' ? aggregationExecutorAddress : to
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
                B.recipient = etherOut || feeConfig?.chargeFeeBy === 'currency_out' ? aggregationExecutorAddress : to
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
          destTokenFeeData,
        ]
        const executorDataForSwapSimpleMode = encodeSimpleModeData({
          firstPools,
          firstSwapAmounts,
          swapSequences,
          deadline,
          destTokenFeeData,
        })

        const cData = encodeParameters(['string'], [JSON.stringify(clientData)])

        args = [aggregationExecutorAddress, swapDesc, executorDataForSwapSimpleMode, cData]
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
                  src[aggregationExecutorAddress] ?? '0',
                )
              }
              if (sequence.length === 1 && isEncodeUniswap(firstPool)) {
                firstPool.recipient =
                  etherOut || feeConfig?.chargeFeeBy === 'currency_out' ? aggregationExecutorAddress : to
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
                B.recipient = etherOut || feeConfig?.chargeFeeBy === 'currency_out' ? aggregationExecutorAddress : to
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
          amountWithFeeIn,
          amountOut,
          etherIn ? numberToHex(0) : numberToHex(4),
          destTokenFeeData,
        ]
        let executorData = aggregationExecutorContract.interface.encodeFunctionData('nameDoesntMatter', [
          [swapSequences, tokenIn, tokenOut, amountOut, to, deadline, destTokenFeeData],
        ])
        // Remove method id (slice 10).
        executorData = '0x' + executorData.slice(10)

        const cData = encodeParameters(['string'], [JSON.stringify(clientData)])

        args = [aggregationExecutorAddress, swapDesc, executorData, cData]
      }
      if (isUseSwapSimpleMode) {
        getSwapSimpleModeArgs()
      } else {
        getSwapNormalModeArgs()
      }
      if (etherIn) {
        value = amountWithFeeIn
      }
      break
    }
  }
  return {
    methodNames,
    args,
    value,
  }
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 * @param feeConfig
 * @param clientData
 */
function useSwapV2CallArguments(
  trade: Aggregator | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  feeConfig: FeeConfig | undefined,
  clientData: Record<string, any>,
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()
  // const tradeBestExactInAnyway = useTradeExactIn(trade?.inputAmount, trade?.outputAmount.currency || undefined)
  // TODO: resolve this
  // @ts-ignore
  return useMemo(() => {
    if (
      !trade ||
      !recipient ||
      !library ||
      !account ||
      !chainId ||
      !deadline ||
      !(NETWORKS_INFO[chainId].classic.routerV2 || '')
    )
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
        deadline: deadline.toNumber(),
      },
      chainId,
      library,
      feeConfig,
      clientData,
    )
    const swapMethods = methodNames.map(methodName => ({
      methodName,
      args,
      value,
    }))

    return swapMethods.map(parameters => ({ parameters, contract }))
  }, [trade, recipient, library, account, chainId, deadline, allowedSlippage, feeConfig, clientData])
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapV2Callback(
  trade: Aggregator | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  clientData: Record<string, any>,
  encodeInFrontend = false,
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, library } = useActiveWeb3React()
  const { typedValue, feeConfig, saveGas } = useSwapState()

  const swapCalls = useSwapV2CallArguments(trade, allowedSlippage, recipientAddressOrName, feeConfig, clientData)

  const addTransactionWithType = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const gasPrice = useSelector((state: AppState) => state.application.gasPrice)

  const onHandleResponse = useCallback(
    (response: TransactionResponse) => {
      if (!trade) {
        throw new Error('"trade" is undefined.')
      }

      const inputSymbol = trade.inputAmount.currency.symbol
      const outputSymbol = trade.outputAmount.currency.symbol
      const inputAmount = formatCurrencyAmount(trade.inputAmount, 6)
      const outputAmount = formatCurrencyAmount(trade.outputAmount, 6)

      const base = `${
        feeConfig && feeConfig.chargeFeeBy === 'currency_in' && feeConfig.isInBps ? typedValue : inputAmount
      } ${inputSymbol} for ${outputAmount} ${outputSymbol}`
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
          withRecipient,
          saveGas,
          inputAmount: trade.inputAmount.toExact(),
        },
      })

      return response.hash
    },
    [account, addTransactionWithType, feeConfig, recipient, recipientAddressOrName, saveGas, trade, typedValue],
  )

  const sendTransaction = useSendTransactionCallback()

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

    const onSwapWithFrontendEncode = async (): Promise<string> => {
      const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
        swapCalls.map(call => {
          const {
            parameters: { methodName, args, value },
            contract,
          } = call
          const options = !value || isZero(value) ? {} : { value }

          return contract.estimateGas[methodName](...args, options)
            .then(gasEstimate => {
              return {
                call,
                gasEstimate,
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
                      'estimatedCalls exception: Unexpected issue with estimating the gas. Please try again.',
                    ),
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
        }),
      )

      // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
      const successfulEstimation = estimatedCalls.find(
        (el, ix, list): el is SuccessfulCall =>
          'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1]),
      )
      // return new Promise((resolve, reject) => resolve(""))
      if (!successfulEstimation) {
        const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
        if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
        throw new Error(
          'gasEstimate not found: Unexpected error. Please contact support: none of the calls threw an error',
        )
      }

      const {
        call: {
          contract,
          parameters: { methodName, args, value },
        },
        gasEstimate,
      } = successfulEstimation

      console.log(
        '[gas_price] swap used: ',
        gasPrice?.standard ? `api/node: ${gasPrice?.standard} wei` : 'metamask default',
      )

      return contract[methodName](...args, {
        gasLimit: calculateGasMargin(gasEstimate),
        ...(gasPrice?.standard ? { gasPrice: ethers.utils.parseUnits(gasPrice?.standard, 'wei') } : {}),
        ...(value && !isZero(value) ? { value, from: account } : { from: account }),
      })
        .then(onHandleResponse)
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
    }

    const onSwapWithBackendEncode = async (): Promise<string> => {
      const value = BigNumber.from(trade.inputAmount.currency.isNative ? trade.inputAmount.quotient.toString() : 0)
      const hash = await sendTransaction(trade.routerAddress, trade.encodedSwapData, value, onHandleResponse)
      if (hash === undefined) throw new Error('sendTransaction returned undefined.')
      return hash
    }

    return {
      state: SwapCallbackState.VALID,
      callback: encodeInFrontend ? onSwapWithFrontendEncode : onSwapWithBackendEncode,
      error: null,
    }
  }, [
    trade,
    library,
    account,
    chainId,
    recipient,
    encodeInFrontend,
    recipientAddressOrName,
    swapCalls,
    gasPrice,
    onHandleResponse,
    sendTransaction,
  ])
}
