import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { Trade, TradeType, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
import { getTradeVersion, useV1TradeExchangeAddress } from '../data/V1'
import { Field } from '../state/swap/actions'
import { useTransactionAdder } from '../state/transactions/hooks'
import { calculateGasMargin, getRouterContract, shortenAddress, isAddress } from '../utils'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { useActiveWeb3React } from './index'
import { useV1ExchangeContract } from './useContract'
import useENS from './useENS'
import { Version } from './useToggledVersion'

enum SwapType {
  EXACT_TOKENS_FOR_TOKENS,
  EXACT_TOKENS_FOR_ETH,
  EXACT_ETH_FOR_TOKENS,
  TOKENS_FOR_EXACT_TOKENS,
  TOKENS_FOR_EXACT_ETH,
  ETH_FOR_EXACT_TOKENS,
  V1_EXACT_ETH_FOR_TOKENS,
  V1_EXACT_TOKENS_FOR_ETH,
  V1_EXACT_TOKENS_FOR_TOKENS,
  V1_ETH_FOR_EXACT_TOKENS,
  V1_TOKENS_FOR_EXACT_ETH,
  V1_TOKENS_FOR_EXACT_TOKENS
}

function getSwapType(trade: Trade | undefined): SwapType | undefined {
  if (!trade) return undefined
  const chainId = trade.inputAmount.token.chainId
  const inputWETH = trade.inputAmount.token.equals(WETH[chainId])
  const outputWETH = trade.outputAmount.token.equals(WETH[chainId])
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const isV1 = getTradeVersion(trade) === Version.v1
  if (isExactIn) {
    if (inputWETH) {
      return isV1 ? SwapType.V1_EXACT_ETH_FOR_TOKENS : SwapType.EXACT_ETH_FOR_TOKENS
    } else if (outputWETH) {
      return isV1 ? SwapType.V1_EXACT_TOKENS_FOR_ETH : SwapType.EXACT_TOKENS_FOR_ETH
    } else {
      return isV1 ? SwapType.V1_EXACT_TOKENS_FOR_TOKENS : SwapType.EXACT_TOKENS_FOR_TOKENS
    }
  } else {
    if (inputWETH) {
      return isV1 ? SwapType.V1_ETH_FOR_EXACT_TOKENS : SwapType.ETH_FOR_EXACT_TOKENS
    } else if (outputWETH) {
      return isV1 ? SwapType.V1_TOKENS_FOR_EXACT_ETH : SwapType.TOKENS_FOR_EXACT_ETH
    } else {
      return isV1 ? SwapType.V1_TOKENS_FOR_EXACT_TOKENS : SwapType.TOKENS_FOR_EXACT_TOKENS
    }
  }
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  deadline: number = DEFAULT_DEADLINE_FROM_NOW, // in seconds from now
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): null | (() => Promise<string>) {
  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  const tradeVersion = getTradeVersion(trade)
  const v1Exchange = useV1ExchangeContract(useV1TradeExchangeAddress(trade), true)
  const inputAllowance = useTokenAllowance(
    trade?.inputAmount?.token,
    account ?? undefined,
    tradeVersion === Version.v1 ? v1Exchange?.address : ROUTER_ADDRESS
  )

  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !tradeVersion || !chainId) return null

    // will always be defined
    const {
      [Field.INPUT]: slippageAdjustedInput,
      [Field.OUTPUT]: slippageAdjustedOutput
    } = computeSlippageAdjustedAmounts(trade, allowedSlippage)

    if (!slippageAdjustedInput || !slippageAdjustedOutput) return null

    // no allowance
    if (
      !trade.inputAmount.token.equals(WETH[chainId]) &&
      (!inputAllowance || slippageAdjustedInput.greaterThan(inputAllowance))
    ) {
      return null
    }

    return async function onSwap() {
      const contract: Contract | null =
        tradeVersion === Version.v2 ? getRouterContract(chainId, library, account) : v1Exchange
      if (!contract) {
        throw new Error('Failed to get a swap contract')
      }

      const path = trade.route.path.map(t => t.address)

      const deadlineFromNow: number = Math.ceil(Date.now() / 1000) + deadline

      const swapType = getSwapType(trade)

      // let estimate: Function, method: Function,
      let methodNames: string[],
        args: Array<string | string[] | number>,
        value: BigNumber | null = null
      switch (swapType) {
        case SwapType.EXACT_TOKENS_FOR_TOKENS:
          methodNames = ['swapExactTokensForTokens', 'swapExactTokensForTokensSupportingFeeOnTransferTokens']
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
          methodNames = ['swapExactETHForTokens', 'swapExactETHForTokensSupportingFeeOnTransferTokens']
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
          methodNames = ['swapExactTokensForETH', 'swapExactTokensForETHSupportingFeeOnTransferTokens']
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
        case SwapType.V1_EXACT_ETH_FOR_TOKENS:
          methodNames = ['ethToTokenTransferInput']
          args = [slippageAdjustedOutput.raw.toString(), deadlineFromNow, recipient]
          value = BigNumber.from(slippageAdjustedInput.raw.toString())
          break
        case SwapType.V1_EXACT_TOKENS_FOR_TOKENS:
          methodNames = ['tokenToTokenTransferInput']
          args = [
            slippageAdjustedInput.raw.toString(),
            slippageAdjustedOutput.raw.toString(),
            1,
            deadlineFromNow,
            recipient,
            trade.outputAmount.token.address
          ]
          break
        case SwapType.V1_EXACT_TOKENS_FOR_ETH:
          methodNames = ['tokenToEthTransferOutput']
          args = [
            slippageAdjustedOutput.raw.toString(),
            slippageAdjustedInput.raw.toString(),
            deadlineFromNow,
            recipient
          ]
          break
        case SwapType.V1_ETH_FOR_EXACT_TOKENS:
          methodNames = ['ethToTokenTransferOutput']
          args = [slippageAdjustedOutput.raw.toString(), deadlineFromNow, recipient]
          value = BigNumber.from(slippageAdjustedInput.raw.toString())
          break
        case SwapType.V1_TOKENS_FOR_EXACT_ETH:
          methodNames = ['tokenToEthTransferOutput']
          args = [
            slippageAdjustedOutput.raw.toString(),
            slippageAdjustedInput.raw.toString(),
            deadlineFromNow,
            recipient
          ]
          break
        case SwapType.V1_TOKENS_FOR_EXACT_TOKENS:
          methodNames = ['tokenToTokenTransferOutput']
          args = [
            slippageAdjustedOutput.raw.toString(),
            slippageAdjustedInput.raw.toString(),
            MaxUint256.toString(),
            deadlineFromNow,
            recipient,
            trade.outputAmount.token.address
          ]
          break
        default:
          throw new Error(`Unhandled swap type: ${swapType}`)
      }

      const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
        methodNames.map(methodName =>
          contract.estimateGas[methodName](...args, value ? { value } : {})
            .then(calculateGasMargin)
            .catch(error => {
              console.error(`estimateGas failed for ${methodName}`, error)
              return undefined
            })
        )
      )

      // we expect failures from left to right, so throw if we see failures
      // from right to left
      for (let i = 0; i < safeGasEstimates.length - 1; i++) {
        // if the FoT method fails, but the regular method does not, we should not
        // use the regular method. this probably means something is wrong with the fot token.
        if (BigNumber.isBigNumber(safeGasEstimates[i]) && !BigNumber.isBigNumber(safeGasEstimates[i + 1])) {
          throw new Error(
            'An error occurred. Please try raising your slippage. If that does not work, contact support.'
          )
        }
      }

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

        return contract[methodName](...args, {
          gasLimit: safeGasEstimate,
          ...(value ? { value } : {})
        })
          .then((response: any) => {
            const inputSymbol = trade.inputAmount.token.symbol
            const outputSymbol = trade.outputAmount.token.symbol
            const inputAmount = slippageAdjustedInput.toSignificant(3)
            const outputAmount = slippageAdjustedOutput.toSignificant(3)

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
              tradeVersion === Version.v2 ? withRecipient : `${withRecipient} on ${tradeVersion.toUpperCase()}`

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
      }
    }
  }, [
    trade,
    recipient,
    library,
    account,
    tradeVersion,
    chainId,
    allowedSlippage,
    inputAllowance,
    v1Exchange,
    deadline,
    recipientAddressOrName,
    addTransaction
  ])
}
