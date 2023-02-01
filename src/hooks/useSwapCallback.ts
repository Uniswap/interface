import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Router, Trade } from '@kyberswap/ks-sdk-classic'
import { Currency, Percent, TradeType } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { BIPS_BASE, INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTradeExactIn } from 'hooks/Trades'
import useENS from 'hooks/useENS'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'
import { getDynamicFeeRouterContract } from 'utils/getContract'
import isZero from 'utils/isZero'

export type AnyTrade = Trade<Currency, Currency, TradeType>

enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface SwapCall {
  address: string
  calldata: string
  value: string
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

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 */
function useSwapCallArguments(
  trade: AnyTrade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapCall[] {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()
  const tradeBestExactInAnyway = useTradeExactIn(trade?.inputAmount, trade?.outputAmount.currency || undefined)
  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !chainId || !deadline) return []

    const routerContract: Contract | null = getDynamicFeeRouterContract(chainId, library, account)
    if (!routerContract) {
      return []
    }
    const swapMethods = [
      Router.swapCallParameters(trade, {
        feeOnTransfer: false,
        allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
        recipient,
        deadline: deadline.toNumber(),
      }),
    ]

    if (trade.tradeType === TradeType.EXACT_INPUT) {
      swapMethods.push(
        Router.swapCallParameters(trade, {
          feeOnTransfer: true,
          allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
          recipient,
          deadline: deadline.toNumber(),
        }),
      )
    } else if (!!tradeBestExactInAnyway) {
      swapMethods.push(
        Router.swapCallParameters(tradeBestExactInAnyway, {
          feeOnTransfer: true,
          allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
          recipient,
          deadline: deadline.toNumber(),
        }),
      )
    }

    return swapMethods.map(({ methodName, args, value }) => ({
      address: routerContract.address,
      calldata: routerContract.interface.encodeFunctionData(methodName, args),
      value,
    }))
  }, [account, allowedSlippage, chainId, deadline, library, recipient, trade, tradeBestExactInAnyway])
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: AnyTrade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const swapCalls = useSwapCallArguments(trade, allowedSlippage, recipientAddressOrName)

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
            const { address, calldata, value } = call
            const tx =
              !value || isZero(value)
                ? { from: account, to: address, data: calldata }
                : {
                    from: account,
                    to: address,
                    data: calldata,
                    value,
                  }

            return library
              .estimateGas(tx)
              .then((gasEstimate: BigNumber) => {
                return {
                  call,
                  gasEstimate,
                }
              })
              .catch((gasError: any) => {
                // This callback only for swap legacy, dont need to track error on sentry
                console.debug('Gas estimate failed, trying eth_call to extract error', call)

                return library
                  .call(tx)
                  .then((result: any) => {
                    console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                    return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
                  })
                  .catch((callError: any) => {
                    console.debug('Call threw error', call, callError)
                    let errorMessage: string
                    switch (callError.message) {
                      case 'execution reverted: DmmExchangeRouter: INSUFFICIENT_OUTPUT_AMOUNT':
                      case 'execution reverted: DmmExchangeRouter: EXCESSIVE_INPUT_AMOUNT':
                        errorMessage =
                          'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
                        break
                      default:
                        errorMessage = `The transaction cannot succeed due to error: ${callError.message}. This is probably an issue with one of the tokens you are swapping.`
                    }
                    return { call, error: new Error(errorMessage) }
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
          throw new Error('Unexpected error. Please contact support: none of the calls threw an error')
        }

        const {
          call: { address, calldata, value },
        } = successfulEstimation

        return library
          .getSigner()
          .sendTransaction({
            from: account,
            to: address,
            data: calldata,
            // let the wallet try if we can't estimate the gas
            ...('gasEstimate' in successfulEstimation
              ? { gasLimit: calculateGasMargin(successfulEstimation.gasEstimate) }
              : {}),
            ...(value && !isZero(value) ? { value } : {}),
          })
          .then((response: any) => {
            addTransactionWithType({ hash: response.hash, type: TRANSACTION_TYPE.SWAP })
            return response.hash
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error, address, calldata, value)
              throw new Error(`Swap failed: ${error.message}`)
            }
          })
      },
      error: null,
    }
  }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, addTransactionWithType])
}
