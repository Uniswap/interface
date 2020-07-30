import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JSBI, Percent, Router, SwapParameters, Trade, TradeType } from '@uniswap/sdk'
import { useMemo } from 'react'
import { BIPS_BASE, DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { getTradeVersion, useV1TradeExchangeAddress } from '../data/V1'
import { useTransactionAdder } from '../state/transactions/hooks'
import { calculateGasMargin, getRouterContract, isAddress, shortenAddress } from '../utils'
import isZero from '../utils/isZero'
import v1SwapArguments from '../utils/v1SwapArguments'
import { useActiveWeb3React } from './index'
import { useV1ExchangeContract } from './useContract'
import useENS from './useENS'
import useGasEstimates, { EstimatableContractCall, GasEstimateState } from './useGasEstimates'
import { Version } from './useToggledVersion'

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID
}

interface SwapCall {
  contract: Contract
  parameters: SwapParameters
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param deadline the deadline for the trade
 * @param recipientAddressOrName
 */
function useSwapCallArguments(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  deadline: number = DEFAULT_DEADLINE_FROM_NOW, // in seconds from now
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  const v1Exchange = useV1ExchangeContract(useV1TradeExchangeAddress(trade), true)

  return useMemo(() => {
    const tradeVersion = getTradeVersion(trade)
    if (!trade || !recipient || !library || !account || !tradeVersion || !chainId) return []

    const contract: Contract | null =
      tradeVersion === Version.v2 ? getRouterContract(chainId, library, account) : v1Exchange
    if (!contract) {
      return []
    }

    const swapMethods = []

    switch (tradeVersion) {
      case Version.v2:
        swapMethods.push(
          Router.swapCallParameters(trade, {
            feeOnTransfer: false,
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            ttl: deadline
          })
        )

        if (trade.tradeType === TradeType.EXACT_INPUT) {
          swapMethods.push(
            Router.swapCallParameters(trade, {
              feeOnTransfer: true,
              allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
              recipient,
              ttl: deadline
            })
          )
        }
        break
      case Version.v1:
        swapMethods.push(
          v1SwapArguments(trade, {
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            ttl: deadline
          })
        )
        break
    }
    return swapMethods.map(parameters => ({ parameters, contract }))
  }, [account, allowedSlippage, chainId, deadline, library, recipient, trade, v1Exchange])
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  deadline: number = DEFAULT_DEADLINE_FROM_NOW, // in seconds from now
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const swapCalls = useSwapCallArguments(trade, allowedSlippage, deadline, recipientAddressOrName)
  const estimatableSwapCalls: EstimatableContractCall[] = useMemo(
    () =>
      swapCalls.map(({ contract, parameters: { methodName, args, value } }) => ({
        contract,
        methodName,
        value,
        args
      })),
    [swapCalls]
  )
  const gasEstimates = useGasEstimates(estimatableSwapCalls)
  const [indexOfSuccessfulEstimation, loadingGasEstimation] = useMemo(
    () => [
      gasEstimates.findIndex(([, estimate]) => BigNumber.isBigNumber(estimate)),
      gasEstimates.some(([state]) => state === GasEstimateState.LOADING)
    ],
    [gasEstimates]
  )

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

    if (loadingGasEstimation) {
      return { state: SwapCallbackState.LOADING, callback: null, error: null }
    }

    const tradeVersion = getTradeVersion(trade)

    if (indexOfSuccessfulEstimation === -1) {
      return {
        state: SwapCallbackState.INVALID,
        callback: null,
        error: 'Could not compute gas estimation. Try increasing your slippage tolerance.'
      }
    }

    // we expect failures from left to right, so throw if we see failures
    // from right to left
    for (let i = 0; i < gasEstimates.length - 1; i++) {
      // if the FoT method fails, but the regular method does not, we should not
      // use the regular method. this probably means something is wrong with the fot token.
      if (BigNumber.isBigNumber(gasEstimates[i][1]) && !BigNumber.isBigNumber(gasEstimates[i + 1][1])) {
        return {
          state: SwapCallbackState.INVALID,
          callback: null,
          error: 'Unexpected error. Try increasing your slippage tolerance. Otherwise, contact support.'
        }
      }
    }

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap() {
        const {
          contract,
          parameters: { methodName, args, value }
        } = swapCalls[indexOfSuccessfulEstimation]
        const safeGasEstimate = gasEstimates[indexOfSuccessfulEstimation][1]

        return contract[methodName](...args, {
          gasLimit: safeGasEstimate && calculateGasMargin(safeGasEstimate),
          ...(value && !isZero(value) ? { value } : {})
        })
          .then((response: any) => {
            const inputSymbol = trade.inputAmount.currency.symbol
            const outputSymbol = trade.outputAmount.currency.symbol
            const inputAmount = trade.inputAmount.toSignificant(3)
            const outputAmount = trade.outputAmount.toSignificant(3)

            const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
            const withRecipient =
              recipient === account
                ? base
                : `${base} to ${
                    recipientAddressOrName && isAddress(recipientAddressOrName)
                      ? shortenAddress(recipientAddressOrName)
                      : recipientAddressOrName
                  }`

            const withVersion =
              tradeVersion === Version.v2 ? withRecipient : `${withRecipient} on ${(tradeVersion as any).toUpperCase()}`

            addTransaction(response, {
              summary: withVersion
            })

            return response.hash
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw error
            }
            // otherwise, the error was unexpected and we need to convey that
            else {
              console.error(`Swap failed`, error, methodName, args, value)
              throw Error('An error occurred while swapping. Please contact support.')
            }
          })
      },
      error: null
    }
  }, [
    trade,
    library,
    account,
    chainId,
    recipient,
    loadingGasEstimation,
    indexOfSuccessfulEstimation,
    recipientAddressOrName,
    gasEstimates,
    swapCalls,
    addTransaction
  ])
}
