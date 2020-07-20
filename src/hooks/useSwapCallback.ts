import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JSBI, Percent, Router, Trade, TradeType } from '@uniswap/sdk'
import { useMemo } from 'react'
import { BIPS_BASE, DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { getTradeVersion, useV1TradeExchangeAddress } from '../data/V1'
import { useTransactionAdder } from '../state/transactions/hooks'
import { calculateGasMargin, getRouterContract, isAddress, shortenAddress } from '../utils'
import v1SwapArguments from '../utils/v1SwapArguments'
import { useActiveWeb3React } from './index'
import { useV1ExchangeContract } from './useContract'
import useENS from './useENS'
import { Version } from './useToggledVersion'

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

  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !tradeVersion || !chainId) return null

    return async function onSwap() {
      const contract: Contract | null =
        tradeVersion === Version.v2 ? getRouterContract(chainId, library, account) : v1Exchange
      if (!contract) {
        throw new Error('Failed to get a swap contract')
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

      const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
        swapMethods.map(({ args, methodName, value }) =>
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
        if (swapMethods.length === 1) {
          throw Error(
            `An error occurred. If either of the tokens you're swapping take a fee on transfer, you must specify an exact input amount.`
          )
        }
        // if 2 methods exists, either:
        // a) the token is doing something weird not related to FoT (e.g. enforcing a whitelist)
        // b) the token is FoT and is taking more than the specified slippage
        else if (swapMethods.length === 2) {
          throw Error(
            `An error occurred. If either of the tokens you're swapping take a fee on transfer, you must specify a slippage tolerance higher than the fee.`
          )
        } else {
          throw Error('This transaction would fail. Please contact support.')
        }
      } else {
        const { methodName, args, value } = swapMethods[indexOfSuccessfulEstimation]
        const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

        return contract[methodName](...args, {
          gasLimit: safeGasEstimate,
          ...(value ? { value } : {})
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
    v1Exchange,
    deadline,
    recipientAddressOrName,
    addTransaction
  ])
}
